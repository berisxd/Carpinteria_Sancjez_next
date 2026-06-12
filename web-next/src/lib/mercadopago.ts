import { randomUUID } from "crypto";

const MP_API_BASE = "https://api.mercadopago.com";

export type MercadoPagoPaymentStatus =
  | "approved"
  | "pending"
  | "in_process"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back"
  | string;

interface MpPreferenceItem {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: "MXN";
}

interface CreatePreferenceInput {
  externalReference: string;
  customer: {
    nombreDestinatario: string;
    email: string;
    telefono: string;
  };
  items: MpPreferenceItem[];
  appUrl: string;
}

export interface MpPaymentResponse {
  id: number;
  status?: MercadoPagoPaymentStatus;
  external_reference?: string;
  order?: {
    id?: number;
  };
}

export interface MpMerchantOrderResponse {
  id: number;
  external_reference?: string;
  payments?: Array<{
    id?: number;
    status?: MercadoPagoPaymentStatus;
  }>;
}

function getAccessToken() {
  const token = process.env.MP_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("MP_ACCESS_TOKEN is missing.");
  }
  return token;
}

async function mpFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getAccessToken();
  const response = await fetch(`${MP_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Mercado Pago API error (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as T;
}

export async function createCheckoutPreference(input: CreatePreferenceInput) {
  const body = {
    items: input.items,
    payer: {
      name: input.customer.nombreDestinatario,
      email: input.customer.email,
      phone: { number: input.customer.telefono },
    },
    back_urls: {
      success: `${input.appUrl}/pago/resultado?resultado=exitoso`,
      failure: `${input.appUrl}/pago/resultado?resultado=fallido`,
      pending: `${input.appUrl}/pago/resultado?resultado=pendiente`,
    },
    auto_return: "approved",
    notification_url: `${input.appUrl}/api/mercadopago/webhook`,
    external_reference: input.externalReference,
    statement_descriptor: "CARPINTERIA SANCHEZ",
  };

  const response = await mpFetch<{
    id: string;
    init_point?: string;
    sandbox_init_point?: string;
  }>("/checkout/preferences", {
    method: "POST",
    headers: {
      "X-Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify(body),
  });

  return response;
}

export async function getPayment(paymentId: string | number) {
  return mpFetch<MpPaymentResponse>(`/v1/payments/${paymentId}`);
}

export async function getMerchantOrder(orderId: string | number) {
  return mpFetch<MpMerchantOrderResponse>(`/merchant_orders/${orderId}`);
}

export function mapMpStatusToPedidoStatus(status: MercadoPagoPaymentStatus | undefined) {
  if (!status) {
    return null;
  }

  const estadoMap: Record<string, "confirmado" | "pendiente" | "cancelado"> = {
    approved: "confirmado",
    pending: "pendiente",
    in_process: "pendiente",
    rejected: "cancelado",
    cancelled: "cancelado",
    refunded: "cancelado",
    charged_back: "cancelado",
  };

  return estadoMap[status] ?? null;
}