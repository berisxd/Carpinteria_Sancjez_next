import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Pedido } from "@prisma/client";
import { parsePedidoProductos } from "@/lib/pedidos";

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

export async function buildPedidoTicketPdf(pedido: Pedido) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 40;

  page.drawRectangle({
    x: 0,
    y: height - 96,
    width,
    height: 96,
    color: rgb(0.06, 0.24, 0.45),
  });

  page.drawText("Carpinteria Sanchez", {
    x: 42,
    y: height - 52,
    size: 21,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("Privada Progreso No. 12, San Cosme Atlamaxac, Tepeyanco, Tlaxcala", {
    x: 42,
    y: height - 68,
    size: 9,
    font: fontRegular,
    color: rgb(0.92, 0.95, 1),
  });

  page.drawText("Tel. (246) 158 1146 | juanyahelsanchezflores5@gmail.com", {
    x: 42,
    y: height - 81,
    size: 9,
    font: fontRegular,
    color: rgb(0.92, 0.95, 1),
  });

  y -= 84;

  page.drawText("Ticket de pago", {
    x: 42,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.12, 0.16, 0.22),
  });

  y -= 18;

  page.drawText(`Folio #${pedido.id}`, {
    x: 42,
    y,
    size: 10,
    font: fontRegular,
    color: rgb(0.4, 0.44, 0.5),
  });

  page.drawText(`Estado: ${pedido.estado.toUpperCase()}`, {
    x: 380,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.06, 0.24, 0.45),
  });

  y -= 28;

  page.drawText("Datos del cliente", {
    x: 42,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0.06, 0.24, 0.45),
  });

  y -= 18;

  const customerLines = [
    `Nombre: ${pedido.nombreDestinatario}`,
    `Email: ${pedido.email}`,
    `Telefono: ${pedido.telefono}`,
    `Direccion: ${pedido.direccion}`,
    `Ciudad: ${pedido.ciudad} ${pedido.codigoPostal}`,
    pedido.referencia ? `Referencia: ${pedido.referencia}` : "",
  ].filter(Boolean);

  for (const line of customerLines) {
    page.drawText(line, {
      x: 42,
      y,
      size: 10,
      font: fontRegular,
      color: rgb(0.12, 0.16, 0.22),
    });
    y -= 14;
  }

  y -= 10;

  page.drawText("Detalle de productos", {
    x: 42,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0.06, 0.24, 0.45),
  });

  y -= 18;

  page.drawText("Producto", { x: 42, y, size: 10, font: fontBold, color: rgb(0.06, 0.24, 0.45) });
  page.drawText("Cant.", { x: 310, y, size: 10, font: fontBold, color: rgb(0.06, 0.24, 0.45) });
  page.drawText("Precio", { x: 375, y, size: 10, font: fontBold, color: rgb(0.06, 0.24, 0.45) });
  page.drawText("Subtotal", { x: 470, y, size: 10, font: fontBold, color: rgb(0.06, 0.24, 0.45) });

  y -= 14;

  const productos = parsePedidoProductos(pedido.productosJson);

  if (productos.length === 0) {
    page.drawText("Sin detalle de productos.", {
      x: 42,
      y,
      size: 10,
      font: fontRegular,
      color: rgb(0.12, 0.16, 0.22),
    });
    y -= 14;
  } else {
    for (const item of productos) {
      if (y < 120) {
        break;
      }

      const nombre = item.nombre.length > 42 ? `${item.nombre.slice(0, 42)}...` : item.nombre;
      page.drawText(nombre, {
        x: 42,
        y,
        size: 10,
        font: fontRegular,
        color: rgb(0.12, 0.16, 0.22),
      });
      page.drawText(String(item.quantity), {
        x: 318,
        y,
        size: 10,
        font: fontRegular,
        color: rgb(0.12, 0.16, 0.22),
      });
      page.drawText(formatMoney(Number(item.precioUnitario)), {
        x: 365,
        y,
        size: 10,
        font: fontRegular,
        color: rgb(0.12, 0.16, 0.22),
      });
      page.drawText(formatMoney(Number(item.subtotal)), {
        x: 458,
        y,
        size: 10,
        font: fontRegular,
        color: rgb(0.12, 0.16, 0.22),
      });
      y -= 14;
    }
  }

  y -= 12;

  page.drawLine({
    start: { x: 42, y },
    end: { x: width - 42, y },
    thickness: 1,
    color: rgb(0.82, 0.85, 0.89),
  });

  y -= 24;

  page.drawText("Total a pagar:", {
    x: 390,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.12, 0.16, 0.22),
  });
  page.drawText(formatMoney(Number(pedido.total)), {
    x: 480,
    y,
    size: 15,
    font: fontBold,
    color: rgb(0.06, 0.24, 0.45),
  });

  // ── Extra section for tienda voucher ─────────────────────────────────────────
  if (pedido.metodoPago === "ticket_tienda") {
    y -= 50;

    // Voucher box
    page.drawRectangle({
      x: 42,
      y: y - 88,
      width: width - 84,
      height: 88,
      color: rgb(0.97, 0.96, 0.90),
      borderColor: rgb(0.86, 0.61, 0.12),
      borderWidth: 1.5,
    });

    page.drawText("VOUCHER PARA PAGO EN TIENDA", {
      x: 52,
      y: y - 18,
      size: 11,
      font: fontBold,
      color: rgb(0.60, 0.39, 0.03),
    });

    const voucherLines = [
      "Presenta este documento en nuestra sucursal para confirmar tu pedido.",
      `Monto a pagar: ${formatMoney(Number(pedido.total))}`,
      "Aceptamos: Efectivo | Tarjeta de debito/credito",
      "Sucursal: Privada Progreso No. 12, San Cosme Atlamaxac, Tepeyanco, Tlaxcala",
      "Tel: (246) 158 1146",
    ];

    let vy = y - 34;
    for (const line of voucherLines) {
      page.drawText(line, {
        x: 52,
        y: vy,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.22, 0.16, 0.04),
      });
      vy -= 11;
    }

    y -= 100;
  }

  // Signature area (for tienda payment)
  if (pedido.metodoPago === "ticket_tienda") {
    y -= 20;
    page.drawLine({
      start: { x: 42, y },
      end: { x: 220, y },
      thickness: 0.7,
      color: rgb(0.6, 0.62, 0.66),
    });
    page.drawLine({
      start: { x: 360, y },
      end: { x: 540, y },
      thickness: 0.7,
      color: rgb(0.6, 0.62, 0.66),
    });
    y -= 10;
    page.drawText("Firma del cliente", {
      x: 100,
      y,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.52, 0.55),
    });
    page.drawText("Sello / Firma Carpinteria Sanchez", {
      x: 360,
      y,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.52, 0.55),
    });
  }

  page.drawText("Documento generado automaticamente por Carpinteria Sanchez", {
    x: 140,
    y: 28,
    size: 8,
    font: fontRegular,
    color: rgb(0.4, 0.44, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
