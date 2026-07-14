import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/pedidos";
import { notifyAll, notifyWorker, msgReporteDiario, msgPedidosPendientes, getWorkers } from "@/lib/notifications";

// ── Types ─────────────────────────────────────────────────────────────────────

type AssistantResponse = {
  answer: string;
  data?: Record<string, unknown>;
  suggestions?: string[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function startOf(unit: "today" | "week" | "month" | "year"): Date {
  const now = new Date();
  if (unit === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (unit === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (unit === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  // year
  return new Date(now.getFullYear(), 0, 1);
}

function periodLabel(text: string): "today" | "week" | "month" | "year" | null {
  if (/hoy|today/.test(text)) return "today";
  if (/semana|week|7 d/.test(text)) return "week";
  if (/mes|month/.test(text)) return "month";
  if (/año|year|anual/.test(text)) return "year";
  return null;
}

function matchesIntent(text: string, ...patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

// ── Intent handlers ───────────────────────────────────────────────────────────

async function handlePedidosCount(period: "today" | "week" | "month" | "year" | null): Promise<AssistantResponse> {
  const since = period ? startOf(period) : null;
  const where = since ? { createdAt: { gte: since } } : {};
  const total = await prisma.pedido.count({ where });
  const pendiente = await prisma.pedido.count({ where: { ...where, estado: "pendiente" } });
  const labels: Record<string, string> = { today: "hoy", week: "los últimos 7 días", month: "este mes", year: "este año" };
  const label = period ? labels[period] : "en total";

  return {
    answer: `Hay **${total} pedidos** ${label}${pendiente > 0 ? `, de los cuales **${pendiente} están pendientes**` : ""}.`,
    data: { total, pendiente },
    suggestions: [
      "¿Cuánto vendí esta semana?",
      "Pedidos pendientes",
      "Últimos 5 pedidos",
    ],
  };
}

async function handleVentas(period: "today" | "week" | "month" | "year" | null): Promise<AssistantResponse> {
  const since = period ? startOf(period) : null;
  const where = since
    ? { createdAt: { gte: since }, estado: { not: "cancelado" } }
    : { estado: { not: "cancelado" } };
  const agg = await prisma.pedido.aggregate({ _sum: { total: true }, where });
  const count = await prisma.pedido.count({ where });
  const total = Number(agg._sum.total ?? 0);
  const labels: Record<string, string> = { today: "hoy", week: "los últimos 7 días", month: "este mes", year: "este año" };
  const label = period ? labels[period] : "en total";

  return {
    answer: `Las ventas ${label} suman **${formatCurrency(total)}** en **${count} pedidos** (sin contar cancelados).`,
    data: { total, count },
    suggestions: [
      "¿Cuántos pedidos pendientes hay?",
      "Productos más vendidos",
      "Ventas de este mes",
    ],
  };
}

async function handlePendientes(): Promise<AssistantResponse> {
  const pedidos = await prisma.pedido.findMany({
    where: { estado: "pendiente" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, nombreDestinatario: true, total: true, createdAt: true },
  });
  const total = await prisma.pedido.count({ where: { estado: "pendiente" } });

  if (total === 0) {
    return {
      answer: "¡Excelente! No hay pedidos pendientes en este momento.",
      suggestions: ["¿Cuánto vendí esta semana?", "Últimos pedidos"],
    };
  }

  const lista = pedidos
    .map((p, i) => `${i + 1}. **${p.nombreDestinatario}** — ${formatCurrency(Number(p.total))} (ID: \`${p.id.slice(0, 8)}…\`)`)
    .join("\n");

  return {
    answer: `Hay **${total} pedidos pendientes**. Los más recientes:\n\n${lista}`,
    data: { total, pedidos },
    suggestions: ["Ver pedido en detalle", "¿Cuánto vendí este mes?", "Productos deshabilitados"],
  };
}

async function handleUltimosPedidos(): Promise<AssistantResponse> {
  const pedidos = await prisma.pedido.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, nombreDestinatario: true, estado: true, total: true, createdAt: true },
  });

  if (pedidos.length === 0) {
    return { answer: "Todavía no hay pedidos registrados.", suggestions: ["Ver productos"] };
  }

  const lista = pedidos
    .map((p, i) => {
      const fecha = p.createdAt.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
      return `${i + 1}. **${p.nombreDestinatario}** · ${p.estado} · ${formatCurrency(Number(p.total))} · ${fecha}`;
    })
    .join("\n");

  return {
    answer: `Últimos 5 pedidos:\n\n${lista}`,
    data: { pedidos },
    suggestions: ["Pedidos pendientes", "¿Cuánto vendí este mes?"],
  };
}

async function handleProductosMasVendidos(): Promise<AssistantResponse> {
  // Items are stored as JSON in Pedido.productosJson — aggregate in memory.
  type ItemJSON = { id: string; nombre: string; quantity: number };

  const pedidos = await prisma.pedido.findMany({
    where: { estado: { not: "cancelado" } },
    select: { productosJson: true },
  });

  const conteo = new Map<string, { nombre: string; cantidad: number }>();
  for (const pedido of pedidos) {
    try {
      const items = JSON.parse(pedido.productosJson) as ItemJSON[];
      for (const item of items) {
        const prev = conteo.get(item.id);
        conteo.set(item.id, {
          nombre: item.nombre,
          cantidad: (prev?.cantidad ?? 0) + (item.quantity ?? 0),
        });
      }
    } catch { /* ignore malformed JSON */ }
  }

  const sorted = [...conteo.entries()]
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 5);

  if (sorted.length === 0) {
    return { answer: "Todavía no hay ventas de productos registradas.", suggestions: [] };
  }

  const lista = sorted
    .map(([, data], i) => `${i + 1}. **${data.nombre}** — ${data.cantidad} unidades`)
    .join("\n");

  return {
    answer: `Productos más vendidos:\n\n${lista}`,
    suggestions: ["¿Cuánto vendí este mes?", "Productos deshabilitados"],
  };
}

async function handleProductosDeshabilitados(): Promise<AssistantResponse> {
  const count = await prisma.producto.count({ where: { habilitado: false } });
  const productos = await prisma.producto.findMany({
    where: { habilitado: false },
    take: 5,
    select: { id: true, nombre: true, categoria: { select: { nombre: true } } },
  });

  if (count === 0) {
    return { answer: "Todos los productos están habilitados.", suggestions: ["Productos más vendidos"] };
  }

  const lista = productos
    .map((p, i) => `${i + 1}. **${p.nombre}** (${p.categoria.nombre})`)
    .join("\n");

  return {
    answer: `Hay **${count} producto${count !== 1 ? "s" : ""} deshabilitado${count !== 1 ? "s" : ""}**. ${count > 5 ? `Mostrando los primeros 5:` : ""}\n\n${lista}`,
    suggestions: ["Habilitar un producto", "Productos más vendidos"],
  };
}

async function handleResumen(): Promise<AssistantResponse> {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalPedidos,
    pendientes,
    ventasMes,
    totalProductos,
    habilitados,
  ] = await Promise.all([
    prisma.pedido.count(),
    prisma.pedido.count({ where: { estado: "pendiente" } }),
    prisma.pedido.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: firstOfMonth }, estado: { not: "cancelado" } },
    }),
    prisma.producto.count(),
    prisma.producto.count({ where: { habilitado: true } }),
  ]);

  const vMes = Number(ventasMes._sum.total ?? 0);

  return {
    answer: `📊 **Resumen rápido del negocio:**\n\n• Pedidos totales: **${totalPedidos}** (${pendientes} pendientes)\n• Ventas este mes: **${formatCurrency(vMes)}**\n• Catálogo: **${habilitados}** de ${totalProductos} productos activos`,
    suggestions: [
      "¿Cuánto vendí esta semana?",
      "Pedidos pendientes",
      "Productos más vendidos",
    ],
  };
}

async function handleCotizaciones(): Promise<AssistantResponse> {
  const total = await prisma.contacto.count();
  const recientes = await prisma.contacto.findMany({
    orderBy: { createdAt: "desc" },
    take: 4,
    select: { nombre: true, contacto: true, mensaje: true, createdAt: true },
  });

  if (total === 0) {
    return { answer: "No hay mensajes de contacto/cotización todavía.", suggestions: [] };
  }

  const lista = recientes
    .map((c, i) => {
      const fecha = c.createdAt.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
      return `${i + 1}. **${c.nombre}** (${c.contacto}) · ${fecha}`;
    })
    .join("\n");

  return {
    answer: `Hay **${total} mensajes** de contacto/cotización. Los más recientes:\n\n${lista}`,
    suggestions: ["Pedidos pendientes", "Resumen general"],
  };
}

async function handleNotifyReport(targetWorker?: string): Promise<AssistantResponse> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [ventasHoy, pedidosHoy, pendientes, productosActivos] = await Promise.all([
    prisma.pedido.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: today }, estado: { not: "cancelado" } },
    }),
    prisma.pedido.count({ where: { createdAt: { gte: today } } }),
    prisma.pedido.count({ where: { estado: "pendiente" } }),
    prisma.producto.count({ where: { habilitado: true } }),
  ]);

  const fechaHoy = now.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const msg = msgReporteDiario({
    fechaHoy,
    ventasHoy: formatCurrency(Number(ventasHoy._sum.total ?? 0)),
    pedidosHoy,
    pendientes,
    productosActivos,
  });

  const results = targetWorker
    ? await notifyWorker(targetWorker, msg).then((r) => (r ? [r] : []))
    : await notifyAll(msg);

  const sent = results.filter((r) => r.telegram === "ok" || r.whatsapp === "ok").length;
  const dest = targetWorker ?? "todos los trabajadores";

  if (sent === 0 && results.length === 0) {
    return {
      answer: "No hay trabajadores configurados con canales de notificación.\n\nConfigura `WORKERS_CONFIG` en tu `.env` para activar esta función.",
      suggestions: ["Resumen general", "Pedidos pendientes"],
    };
  }

  return {
    answer: `✅ Reporte del día enviado a **${dest}** (${sent}/${results.length} canales activos).\n\nResumen enviado:\n• Ventas hoy: **${formatCurrency(Number(ventasHoy._sum.total ?? 0))}**\n• Pedidos nuevos: **${pedidosHoy}**\n• Pendientes: **${pendientes}**`,
    suggestions: ["Enviar alerta de pendientes", "Resumen general"],
  };
}

async function handleNotifyPending(): Promise<AssistantResponse> {
  const count = await prisma.pedido.count({ where: { estado: "pendiente" } });

  if (count === 0) {
    return { answer: "¡No hay pedidos pendientes! No se envió ninguna alerta.", suggestions: ["Resumen general"] };
  }

  const pedidos = await prisma.pedido.findMany({
    where: { estado: "pendiente" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, nombreDestinatario: true, total: true },
  });

  const detalle = pedidos
    .map((p, i) => `${i + 1}. ${p.nombreDestinatario} — ${formatCurrency(Number(p.total))}`)
    .join("\n");

  const msg = msgPedidosPendientes(count, detalle);
  const results = await notifyAll(msg);
  const sent = results.filter((r) => r.telegram === "ok" || r.whatsapp === "ok").length;

  return {
    answer: `⚠️ Alerta enviada a **${sent} canal${sent !== 1 ? "es" : ""}**. Hay **${count} pedido${count !== 1 ? "s" : ""} pendiente${count !== 1 ? "s" : ""}**.`,
    suggestions: ["Pedidos pendientes", "Enviar reporte del día"],
  };
}

function handleListWorkers(): AssistantResponse {
  const workers = getWorkers();
  if (workers.length === 0) {
    return {
      answer: "No hay trabajadores configurados todavía.\n\nAgrega `WORKERS_CONFIG` en tu `.env` con los datos de cada trabajador.",
      suggestions: [],
    };
  }
  const lista = workers
    .map((w, i) => {
      const channels = [w.telegram_chat_id ? "Telegram ✓" : "", w.whatsapp_phone ? "WhatsApp ✓" : ""]
        .filter(Boolean)
        .join(", ") || "sin canales";
      return `${i + 1}. **${w.name}** (${w.role}) — ${channels}`;
    })
    .join("\n");
  return {
    answer: `Trabajadores configurados:\n\n${lista}`,
    suggestions: ["Enviar reporte del día", "Enviar alerta de pendientes"],
  };
}

// ── Main router ───────────────────────────────────────────────────────────────

async function resolveIntent(query: string): Promise<AssistantResponse> {
  const text = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Saludos / ayuda
  if (matchesIntent(text, /^(hola|buenas|hey|hi|hello|ayuda|help|que puedes|que sabes)$/)) {
    return {
      answer: "¡Hola! Soy tu asistente de Carpintería Sánchez 🪵\n\nPuedo ayudarte con:\n\n• **Pedidos**: cuántos hay, pendientes, últimos\n• **Ventas**: totales, por período (hoy, semana, mes)\n• **Productos**: más vendidos, deshabilitados\n• **Resumen general** del negocio\n• **Notificaciones**: enviar reporte o alerta a trabajadores vía Telegram/WhatsApp\n\n¿Qué quieres saber?",
      suggestions: [
        "Resumen general",
        "Pedidos pendientes",
        "¿Cuánto vendí este mes?",
        "Enviar reporte del día",
      ],
    };
  }

  // Resumen
  if (matchesIntent(text, /resumen|general|overview|como vamos|estado del negocio/)) {
    return handleResumen();
  }

  // Notificar — enviar reporte
  if (matchesIntent(text, /envia|notific|avisa|manda|reporta/, /reporte|informe|resumen del dia/)) {
    // Check if targeting a specific worker by name
    const workers = getWorkers();
    const targetWorker = workers.find((w) =>
      text.includes(w.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
    );
    return handleNotifyReport(targetWorker?.name);
  }

  // Enviar alerta de pendientes
  if (
    matchesIntent(text, /envia|notific|avisa|manda/, /pendiente|alerta/) ||
    matchesIntent(text, /alerta de pendiente|alert.*pendiente/)
  ) {
    return handleNotifyPending();
  }

  // Listar trabajadores
  if (matchesIntent(text, /trabajador|empleado|equipo|quien recibe|quienes reciben/)) {
    return handleListWorkers();
  }

  // Ventas
  if (matchesIntent(text, /venta|ingreso|recaud|factur|gane|gano/)) {
    const period = periodLabel(text);
    return handleVentas(period);
  }

  // Cotizaciones / contacto
  if (matchesIntent(text, /cotizacion|contacto|mensaje|solicitud/)) {
    return handleCotizaciones();
  }

  // Pedidos pendientes
  if (matchesIntent(text, /pendiente/)) {
    return handlePendientes();
  }

  // Últimos pedidos
  if (matchesIntent(text, /ultimo|reciente|nuevo pedido/)) {
    return handleUltimosPedidos();
  }

  // Pedidos (count con período)
  if (matchesIntent(text, /pedido|orden/)) {
    const period = periodLabel(text);
    return handlePedidosCount(period);
  }

  // Productos más vendidos
  if (matchesIntent(text, /mas vendido|popular|top producto|mejor producto|vende mas/)) {
    return handleProductosMasVendidos();
  }

  // Productos deshabilitados
  if (matchesIntent(text, /deshabilit|inactivo|sin stock|oculto/)) {
    return handleProductosDeshabilitados();
  }

  // Fallback
  return {
    answer: "No estoy seguro de cómo responder eso. Prueba con preguntas como:\n\n• *¿Cuántos pedidos hay hoy?*\n• *¿Cuánto vendí este mes?*\n• *Pedidos pendientes*\n• *Productos más vendidos*\n• *Enviar reporte del día*",
    suggestions: [
      "Resumen general",
      "Pedidos pendientes",
      "Enviar reporte del día",
    ],
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as { query?: string };
  const query = String(body.query ?? "").trim();

  if (!query || query.length > 500) {
    return NextResponse.json({ error: "Consulta inválida" }, { status: 400 });
  }

  try {
    const result = await resolveIntent(query);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { answer: "Ocurrió un error consultando los datos. Intenta de nuevo.", suggestions: [] },
      { status: 500 }
    );
  }
}
