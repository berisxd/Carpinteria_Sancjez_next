"use client";

import { useState, useRef, useEffect, FormEvent } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
  suggestions?: string[];
};

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  text: "¡Hola! Soy tu asistente. Pregúntame sobre pedidos, ventas o productos.",
  suggestions: [
    "Resumen general",
    "Pedidos pendientes",
    "¿Cuánto vendí este mes?",
    "Productos más vendidos",
  ],
};

function MarkdownText({ text }: { text: string }) {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="rounded bg-slate-700 px-1 py-0.5 text-xs text-amber-300">$1</code>')
    .replace(/\n/g, "<br />");
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function AdminAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  async function send(query: string) {
    if (!query.trim() || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = (await res.json()) as { answer?: string; suggestions?: string[]; error?: string };
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer ?? data.error ?? "Sin respuesta.",
          suggestions: data.suggestions,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Error de conexión. Intenta de nuevo." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <>
      {/* ── Floating button ───────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-200 hover:scale-105"
        style={{ background: "linear-gradient(135deg, #c07d30, #a86828)" }}
      >
        {open ? (
          <XIcon className="h-6 w-6 text-white" />
        ) : (
          <>
            <BotIcon className="h-7 w-7 text-white" />
            <span
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: "#22c55e" }}
            >
              IA
            </span>
          </>
        )}
      </button>

      {/* ── Chat panel ───────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex w-[360px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl shadow-2xl"
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            background: "#0f172a",
            height: "min(560px, calc(100vh - 8rem))",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3.5"
            style={{ background: "linear-gradient(135deg, #1a3520, #112518)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: "rgba(192,125,48,0.2)", border: "1px solid rgba(192,125,48,0.3)" }}
            >
              <BotIcon className="h-5 w-5" style={{ color: "#c07d30" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Asistente Admin</p>
              <p className="flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                En línea · Datos en tiempo real
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto rounded-md p-1 transition hover:bg-white/10"
            >
              <XIcon className="h-4 w-4" style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-sm text-white"
                      : "rounded-bl-sm text-slate-200"
                  }`}
                  style={
                    msg.role === "user"
                      ? { background: "linear-gradient(135deg, #c07d30, #a86828)" }
                      : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }
                  }
                >
                  <MarkdownText text={msg.text} />
                </div>
              </div>
            ))}

            {/* Suggestions */}
            {messages.length > 0 &&
              messages[messages.length - 1].role === "assistant" &&
              messages[messages.length - 1].suggestions?.length && (
                <div className="flex flex-wrap gap-2">
                  {messages[messages.length - 1].suggestions!.map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s)}
                      className="rounded-full px-3 py-1 text-[11px] font-medium transition hover:opacity-80"
                      style={{
                        background: "rgba(192,125,48,0.12)",
                        border: "1px solid rgba(192,125,48,0.25)",
                        color: "#e9a94c",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "#0b1120" }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta algo…"
              disabled={loading}
              className="flex-1 rounded-xl border px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 disabled:opacity-50"
              style={{
                background: "rgba(255,255,255,0.05)",
                borderColor: "rgba(255,255,255,0.1)",
              }}
              maxLength={300}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-40 hover:opacity-80"
              style={{ background: "linear-gradient(135deg, #c07d30, #a86828)" }}
            >
              <SendIcon className="h-4 w-4 text-white" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function BotIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <line x1="12" y1="7" x2="12" y2="11" />
      <line x1="8" y1="16" x2="8" y2="16" strokeWidth={2.5} />
      <line x1="12" y1="16" x2="12" y2="16" strokeWidth={2.5} />
      <line x1="16" y1="16" x2="16" y2="16" strokeWidth={2.5} />
    </svg>
  );
}

function XIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
