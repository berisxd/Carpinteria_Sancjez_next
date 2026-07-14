"use client";

import { useState, useRef, useEffect, FormEvent } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
  suggestions?: string[];
};

const QUICK_ACTIONS = [
  "Resumen general",
  "Pedidos pendientes",
  "¿Cuánto vendí este mes?",
  "Productos más vendidos",
  "Cotizaciones recientes",
];

function MarkdownText({ text }: { text: string }) {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="rounded bg-slate-700 px-1 py-0.5 text-xs text-amber-300">$1</code>')
    .replace(/\n/g, "<br />");
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function AdminAssistantInline() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const lastMsg = messages[messages.length - 1];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/20 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-4 border-b border-slate-800"
        style={{ background: "linear-gradient(135deg, rgba(26,53,32,0.6), rgba(17,37,24,0.8))" }}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/20">
          <BotIcon className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Asistente Inteligente</p>
          <p className="text-[11px] text-slate-400">Consulta datos del negocio en lenguaje natural</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          En línea
        </span>
      </div>

      <div className="p-6 space-y-5">
        {/* Quick actions */}
        {messages.length === 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Consultas rápidas
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => void send(action)}
                  className="rounded-full px-3.5 py-1.5 text-[12px] font-medium transition hover:opacity-80"
                  style={{
                    background: "rgba(192,125,48,0.1)",
                    border: "1px solid rgba(192,125,48,0.2)",
                    color: "#e9a94c",
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message thread */}
        {messages.length > 0 && (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
                  }`}
                  style={
                    msg.role === "user"
                      ? { background: "linear-gradient(135deg, #c07d30, #a86828)", color: "#fff" }
                      : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "#cbd5e1" }
                  }
                >
                  <MarkdownText text={msg.text} />
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-xl rounded-bl-sm px-4 py-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        {/* Suggestions under last answer */}
        {lastMsg?.role === "assistant" && lastMsg.suggestions?.length && (
          <div className="flex flex-wrap gap-2">
            {lastMsg.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => void send(s)}
                className="rounded-full px-3 py-1 text-[11px] font-medium transition hover:opacity-80"
                style={{
                  background: "rgba(192,125,48,0.1)",
                  border: "1px solid rgba(192,125,48,0.2)",
                  color: "#e9a94c",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ej: ¿Cuántos pedidos hay hoy?"
            disabled={loading}
            maxLength={300}
            className="flex-1 rounded-xl border px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 disabled:opacity-50"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(255,255,255,0.09)",
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-40 hover:opacity-80"
            style={{ background: "linear-gradient(135deg, #c07d30, #a86828)" }}
          >
            <SendIcon className="h-4 w-4 text-white" />
          </button>
        </form>
      </div>
    </section>
  );
}

function BotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <line x1="12" y1="7" x2="12" y2="11" />
      <line x1="8" y1="16" x2="8" y2="16" strokeWidth={2.5} />
      <line x1="12" y1="16" x2="12" y2="16" strokeWidth={2.5} />
      <line x1="16" y1="16" x2="16" y2="16" strokeWidth={2.5} />
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
