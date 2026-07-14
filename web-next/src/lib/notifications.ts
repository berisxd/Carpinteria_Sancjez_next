// ── Notification helpers ──────────────────────────────────────────────────────
// Sends messages to configured workers via Telegram (and optionally WhatsApp).
// Workers are configured via WORKERS_CONFIG env var (JSON array).
// Telegram requires TELEGRAM_BOT_TOKEN env var.
//
// Example WORKERS_CONFIG:
// [{"name":"Juan","role":"operario","telegram_chat_id":"123456789"}]
// ─────────────────────────────────────────────────────────────────────────────

export type Worker = {
  name: string;
  role: string;
  telegram_chat_id?: string;
  whatsapp_phone?: string;
};

export type NotifyResult = {
  worker: string;
  telegram: "ok" | "error" | "skipped";
  whatsapp: "ok" | "error" | "skipped";
};

export function getWorkers(): Worker[] {
  const raw = process.env.WORKERS_CONFIG;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Worker[];
  } catch {
    return [];
  }
}

async function sendTelegram(chatId: string, text: string): Promise<"ok" | "error"> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return "error";
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
      },
    );
    return res.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

export async function notifyWorker(
  workerName: string,
  msg: string,
): Promise<NotifyResult | null> {
  const workers = getWorkers();
  const worker = workers.find((w) => w.name === workerName);
  if (!worker) return null;

  const result: NotifyResult = {
    worker: worker.name,
    telegram: "skipped",
    whatsapp: "skipped",
  };

  if (worker.telegram_chat_id) {
    result.telegram = await sendTelegram(worker.telegram_chat_id, msg);
  }

  // WhatsApp integration requires Business API or Twilio; mark as skipped for now.
  if (worker.whatsapp_phone) {
    result.whatsapp = "skipped";
  }

  return result;
}

export async function notifyAll(msg: string): Promise<NotifyResult[]> {
  const workers = getWorkers();
  const results = await Promise.all(workers.map((w) => notifyWorker(w.name, msg)));
  return results.filter((r): r is NotifyResult => r !== null);
}

// ── Message templates ─────────────────────────────────────────────────────────

export function msgReporteDiario(params: {
  fechaHoy: string;
  ventasHoy: string;
  pedidosHoy: number;
  pendientes: number;
  productosActivos: number;
}): string {
  const { fechaHoy, ventasHoy, pedidosHoy, pendientes, productosActivos } = params;
  return [
    `📊 *Reporte diario — ${fechaHoy}*`,
    "",
    `• Ventas hoy: *${ventasHoy}*`,
    `• Pedidos nuevos: *${pedidosHoy}*`,
    `• Pendientes: *${pendientes}*`,
    `• Productos activos: *${productosActivos}*`,
  ].join("\n");
}

export function msgPedidosPendientes(count: number, detalle: string): string {
  return [
    `⚠️ *Alerta: ${count} pedido${count !== 1 ? "s" : ""} pendiente${count !== 1 ? "s" : ""}*`,
    "",
    detalle,
  ].join("\n");
}

export function msgNuevoPedido(params: {
  id: string;
  cliente: string;
  total: string;
  metodo: string;
}): string {
  const { id, cliente, total, metodo } = params;
  return [
    `🛒 *Nuevo pedido recibido*`,
    "",
    `• ID: \`${id}\``,
    `• Cliente: *${cliente}*`,
    `• Total: *${total}*`,
    `• Método: *${metodo}*`,
  ].join("\n");
}
