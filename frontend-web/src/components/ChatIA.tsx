import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Loader2, Send, Sparkles, X } from 'lucide-react';
import { sendAiMessage } from '../services/ai';
import type { ChatMessage } from '../services/ai';
import { getErrorMessage } from '../services/http-error';

interface DisplayMessage extends ChatMessage {
  actions?: string[];
}

interface ChatIAProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
}

const EXAMPLES = [
  'Crea la clase Cliente con atributos id y nombre',
  'Agrégale el atributo email a Cliente',
  'Crea una relación entre Cliente y Pedido',
];

/** RF11 - Asistente de IA: comandos en lenguaje natural sobre el diagrama. */
export function ChatIA({ open, projectId, onClose }: ChatIAProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  if (!open) return null;

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const history: ChatMessage[] = messages.map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setError(null);
    setSending(true);
    try {
      const result = await sendAiMessage(projectId, text, history);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.reply, actions: result.actions },
      ]);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo contactar al asistente'));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="animate-fade-rise fixed right-4 bottom-4 z-30 flex h-[480px] w-[340px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-hairline-strong bg-surface shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
      <div className="flex items-center justify-between border-b border-hairline px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-accent-hi" />
          <h3 className="text-[13px] font-semibold text-ink">Asistente IA</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-ink-muted transition-colors hover:bg-raised hover:text-ink"
          aria-label="Cerrar asistente"
        >
          <X size={15} />
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="space-y-2.5">
            <p className="text-[12px] text-ink-muted">
              Pídeme en lenguaje natural que cree o modifique clases, atributos, métodos o
              relaciones del diagrama.
            </p>
            <ul className="space-y-1.5">
              {EXAMPLES.map((example) => (
                <li key={example}>
                  <button
                    type="button"
                    onClick={() => setInput(example)}
                    className="w-full rounded-lg border border-hairline bg-raised px-2.5 py-1.5 text-left text-[12px] text-ink-soft transition-colors hover:border-hairline-strong hover:bg-overlay"
                  >
                    {example}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-accent px-3 py-2 text-[13px] text-white'
                : 'mr-auto max-w-[85%] rounded-lg rounded-bl-sm bg-raised px-3 py-2 text-[13px] text-ink-soft'
            }
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
            {m.actions && m.actions.length > 0 && (
              <ul className="mt-1.5 space-y-1 border-t border-hairline-strong/50 pt-1.5">
                {m.actions.map((action, j) => (
                  <li key={j} className="flex items-start gap-1 text-[11px] text-ink-faint">
                    <Check size={11} className="mt-0.5 shrink-0 text-positive" />
                    {action}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {sending && (
          <div className="mr-auto flex items-center gap-1.5 text-[12px] text-ink-faint">
            <Loader2 size={13} className="animate-spin" />
            Pensando…
          </div>
        )}
      </div>

      {error && (
        <div className="border-t border-critical/40 bg-critical-soft px-3 py-2 text-[11px] text-critical">
          {error}
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-hairline p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un comando…"
          disabled={sending}
          className="w-full min-w-0 rounded-lg border border-hairline-strong bg-sunken px-2.5 py-1.5 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent-soft disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-hi disabled:opacity-50"
          aria-label="Enviar"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
