"use client";

import { useState } from "react";

type SendStatus = "idle" | "sending" | "ok" | "error";

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

async function sendViaAssistant(query: string): Promise<{ answer: string; error?: string }> {
  const res = await fetch("/api/admin/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return res.json() as Promise<{ answer: string; error?: string }>;
}

export function AdminNotifyWidget() {
  const [reportStatus, setReportStatus] = useState<SendStatus>("idle");
  const [alertStatus, setAlertStatus] = useState<SendStatus>("idle");
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  async function handleSendReport() {
    setReportStatus("sending");
    setLastMessage(null);
    try {
      const data = await sendViaAssistant("Enviar reporte del día");
      setReportStatus("ok");
      setLastMessage(data.answer ?? data.error ?? null);
    } catch {
      setReportStatus("error");
    }
    setTimeout(() => setReportStatus("idle"), 4000);
  }

  async function handleSendAlert() {
    setAlertStatus("sending");
    setLastMessage(null);
    try {
      const data = await sendViaAssistant("Enviar alerta de pendientes");
      setAlertStatus("ok");
      setLastMessage(data.answer ?? data.error ?? null);
    } catch {
      setAlertStatus("error");
    }
    setTimeout(() => setAlertStatus("idle"), 4000);
  }

  function statusIcon(status: SendStatus) {
    if (status === "sending") {
      return (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
      );
    }
    if (status === "ok") {
      return <CheckIcon className="h-4 w-4 text-emerald-400" />;
    }
    if (status === "error") {
      return <XIcon className="h-4 w-4 text-red-400" />;
    }
    return null;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/20">
      {/* Header */}
      <div
        className="flex items-center gap-3 border-b border-slate-800 px-6 py-4"
        style={{ background: "linear-gradient(135deg, rgba(30,26,53,0.6), rgba(24,17,37,0.8))" }}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
          <BellIcon className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Notificaciones</p>
          <p className="text-[11px] text-slate-400">Envía alertas a tu equipo via Telegram</p>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={() => void handleSendReport()}
            disabled={reportStatus === "sending"}
            className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-amber-400/40 hover:bg-slate-750 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>📊 Enviar reporte del día</span>
            <span className="flex items-center gap-1.5">
              {statusIcon(reportStatus)}
              {reportStatus === "idle" && (
                <span className="text-[11px] text-slate-500">→</span>
              )}
            </span>
          </button>

          <button
            onClick={() => void handleSendAlert()}
            disabled={alertStatus === "sending"}
            className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-amber-400/40 hover:bg-slate-750 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>⚠️ Alerta de pendientes</span>
            <span className="flex items-center gap-1.5">
              {statusIcon(alertStatus)}
              {alertStatus === "idle" && (
                <span className="text-[11px] text-slate-500">→</span>
              )}
            </span>
          </button>
        </div>

        {/* Last response */}
        {lastMessage && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Resultado
            </p>
            <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
              {lastMessage}
            </p>
          </div>
        )}

        {/* Config hint */}
        <p className="text-[11px] text-slate-600">
          Configura <code className="text-amber-500/70">WORKERS_CONFIG</code> y{" "}
          <code className="text-amber-500/70">TELEGRAM_BOT_TOKEN</code> en tu{" "}
          <code className="text-amber-500/70">.env</code> para activar envíos.
        </p>
      </div>
    </section>
  );
}
