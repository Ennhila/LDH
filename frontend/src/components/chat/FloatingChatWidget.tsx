import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Bot, Check, Copy, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { API_BASE } from '../../lib/api-base';
import { buildAiChatContext } from '../../lib/ai-chat-context';

const GREETING_TEXT =
  "Hola! Soy Ilyass, tu asistente IA. ¿En qué puedo ayudarte hoy?";

const INPUT_MAX = 250;

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function readGroqSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onDelta: (chunk: string) => void,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        const json = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const piece = json.choices?.[0]?.delta?.content ?? '';
        if (piece) onDelta(piece);
      } catch {
        /* línea incompleta o no JSON */
      }
    }
  }
}

function toApiMessages(msgs: ChatMessage[]): Array<{ role: ChatRole; content: string }> {
  return msgs
    .filter((m) => m.id !== 'greeting' && m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content.trim() }))
    .slice(-20);
}

export type FloatingChatWidgetProps = {
  /** Pulso suave en el botón cuando el panel está cerrado. @default true */
  pulseEnabled?: boolean;
};

export function FloatingChatWidget({ pulseEnabled = true }: FloatingChatWidgetProps) {
  const panelId = useId();
  const titleId = useId();
  const liveId = useId();

  const [isOpen, setIsOpen] = useState(false);
  const [showUnread, setShowUnread] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'greeting', role: 'assistant', content: GREETING_TEXT },
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [panelEntered, setPanelEntered] = useState(false);

  const contextRef = useRef('');
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    buildAiChatContext().then((c) => {
      if (!cancelled) contextRef.current = c;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'ldh-chat-widget-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `@keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 0 rgba(255,102,0,0.45);} 50%{box-shadow:0 0 0 10px rgba(255,102,0,0);} }`;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setPanelEntered(false);
      return;
    }
    const t = requestAnimationFrame(() => setPanelEntered(true));
    return () => cancelAnimationFrame(t);
  }, [isOpen]);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const openPanel = useCallback(() => {
    lastFocusRef.current = document.activeElement as HTMLElement;
    setIsOpen(true);
    setShowUnread(false);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
    if (lastFocusRef.current && lastFocusRef.current !== document.body) {
      /* opcional: restaurar foco previo fuera del widget */
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const root = panelRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], textarea:not([disabled]), input:not([disabled]), select, [tabindex]:not([tabindex="-1"])',
    );
    const list = [...focusables].filter((el) => !el.hasAttribute('disabled'));
    const first = list[0];
    const last = list[list.length - 1];
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePanel();
        return;
      }
      if (e.key !== 'Tab' || list.length === 0) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closePanel]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || text.length > INPUT_MAX) return;

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text };
    const assistantId = uid();
    const assistantPlaceholder: ChatMessage = { id: assistantId, role: 'assistant', content: '' };

    setInput('');
    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setLoading(true);

    const historyForApi = toApiMessages([...messages, userMsg]);

    try {
      const res = await fetch(`${API_BASE}/api/public/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          messages: historyForApi,
          context: contextRef.current,
        }),
      });

      if (res.status === 503) {
        console.error('[LDH Chat] Server missing GROQ_API_KEY — set it on the backend environment.');
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: 'The assistant is not configured on the server yet.' }
              : m,
          ),
        );
        return;
      }

      if (res.status === 429) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "I'm getting too many requests. Please wait a moment." }
              : m,
          ),
        );
        return;
      }

      if (!res.ok || !res.body) {
        let detail = '';
        try {
          const j = await res.json();
          detail = typeof j?.error === 'string' ? j.error : typeof j?.message === 'string' ? j.message : '';
        } catch {
          /* ignore */
        }
        console.error('[LDH Chat] HTTP error', res.status, detail);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: 'Something went wrong. Please try again.' } : m,
          ),
        );
        return;
      }

      const reader = res.body.getReader();
      await readGroqSseStream(reader, (chunk) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
        );
      });
    } catch (e) {
      console.error('[LDH Chat] Network error', e);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: 'Something went wrong. Please try again.' } : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const newConversation = useCallback(() => {
    setMessages([{ id: 'greeting', role: 'assistant', content: GREETING_TEXT }]);
    setInput('');
  }, []);

  const copyMessage = useCallback(async (m: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(m.content);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  const charLeft = INPUT_MAX - input.length;
  const pulseClass =
    pulseEnabled && !isOpen ? 'motion-safe:[animation:pulse-ring_2s_ease-in-out_infinite]' : '';

  const lastId = messages[messages.length - 1]?.id;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`fixed bottom-6 right-6 z-[9998] flex h-14 w-14 items-center justify-center rounded-full bg-ldh-orange text-white shadow-lg shadow-orange-500/35 transition hover:bg-ldh-orange-hover focus:ring-2 focus:ring-ldh-navy focus:ring-offset-2 focus:outline-none ${pulseClass}`}
        aria-label={isOpen ? 'Close chat' : 'Open chat with Ilyass'}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => (isOpen ? closePanel() : openPanel())}
      >
        {isOpen ? <X className="h-6 w-6" aria-hidden /> : <MessageCircle className="h-6 w-6" aria-hidden />}
        {!isOpen && showUnread ? (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ldh-navy px-1 text-[10px] font-bold text-white"
            aria-hidden
          >
            1
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`fixed z-[9999] flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-none border border-slate-200 bg-white shadow-2xl transition-all duration-200 ease-out max-sm:inset-0 sm:bottom-[92px] sm:right-6 sm:h-[520px] sm:max-h-[min(520px,calc(100dvh-120px))] sm:w-[380px] sm:rounded-2xl ${
            panelEntered ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
          }`}
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-ldh-navy px-4 py-3 text-white">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Sparkles className="h-5 w-5 text-ldh-gold" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p id={titleId} className="truncate text-sm font-bold">
                Ilyass
              </p>
              <p className="flex items-center gap-1.5 text-xs text-white/85">
                <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                Online
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-white/90 hover:bg-white/10 focus:ring-2 focus:ring-white/40 focus:outline-none"
              aria-label="Close chat"
              onClick={closePanel}
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div
            id={liveId}
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4"
          >
            {messages.map((m) => {
              if (
                loading &&
                m.role === 'assistant' &&
                !m.content &&
                m.id === lastId
              ) {
                return null;
              }
              return (
              <div
                key={m.id}
                className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {m.role === 'assistant' ? (
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ldh-orange/15 text-ldh-orange"
                    aria-hidden
                  >
                    <Bot className="h-4 w-4" />
                  </span>
                ) : (
                  <span className="mt-1 w-8 shrink-0" aria-hidden />
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'bg-ldh-orange text-white'
                      : 'border border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  {m.role === 'assistant' && m.content ? (
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ldh-navy underline-offset-2 hover:underline"
                      onClick={() => copyMessage(m)}
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden />
                          Copiar
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
              );
            })}

            {loading && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content ? (
              <div className="flex gap-2">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ldh-orange/15 text-ldh-orange">
                  <Bot className="h-4 w-4" />
                </span>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <span className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-slate-100 bg-white px-3 py-3">
            <div className="mb-2 flex justify-between gap-2">
              <button
                type="button"
                className="text-xs font-semibold text-ldh-navy underline-offset-2 hover:underline"
                onClick={newConversation}
              >
                Nueva conversación
              </button>
              <span className={`text-xs ${charLeft < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                {Math.max(0, charLeft)} / {INPUT_MAX}
              </span>
            </div>
            <div className="flex gap-2">
              <label htmlFor={`${panelId}-input`} className="sr-only">
                Message to Ilyass
              </label>
              <textarea
                id={`${panelId}-input`}
                rows={2}
                maxLength={INPUT_MAX}
                value={input}
                disabled={loading}
                placeholder="Type your message…"
                aria-label="Message to Ilyass"
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-ldh-navy focus:ring-2 focus:ring-ldh-navy/20 focus:outline-none disabled:opacity-60"
                onChange={(e) => setInput(e.target.value.slice(0, INPUT_MAX))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
              />
              <button
                type="button"
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ldh-navy text-white shadow-sm transition hover:bg-ldh-navy-dark disabled:opacity-45"
                onClick={() => void sendMessage()}
              >
                <Send className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
