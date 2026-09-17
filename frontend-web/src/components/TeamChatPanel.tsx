import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import type { ProjectChatMessage } from '../services/projects';

interface TeamChatPanelProps {
  open: boolean;
  messages: ProjectChatMessage[];
  currentUserId: string | null;
  connected: boolean;
  onSend: (content: string) => void;
  onClose: () => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Chat en tiempo real entre los colaboradores conectados a un proyecto.
 * Presentacional: EditorPage mantiene la lista de mensajes (histórico +
 * los que llegan por el evento `chat-message` del mismo socket que ya usa
 * para el diagrama, ver services/socket.ts) y emite `send-message` al
 * confirmar el envío.
 */
export function TeamChatPanel({
  open,
  messages,
  currentUserId,
  connected,
  onSend,
  onClose,
}: TeamChatPanelProps) {
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  }

  return (
    <div className="animate-fade-rise fixed bottom-4 left-[4.25rem] z-30 flex h-[480px] w-[320px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-hairline-strong bg-surface shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
      <div className="flex items-center justify-between border-b border-hairline px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <MessageCircle size={14} className="text-accent-hi" />
          <h3 className="text-[13px] font-semibold text-ink">Chat del equipo</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-ink-muted transition-colors hover:bg-raised hover:text-ink"
          aria-label="Cerrar chat"
        >
          <X size={15} />
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="py-6 text-center text-[12px] text-ink-muted">
            Todavía no hay mensajes. Escribe algo para tus colaboradores.
          </p>
        )}

        {messages.map((message) => {
          const isOwn = message.user.id === currentUserId;
          return (
            <div
              key={message.id}
              className={isOwn ? 'ml-auto max-w-[85%]' : 'mr-auto max-w-[85%]'}
            >
              {!isOwn && (
                <p className="mb-0.5 truncate px-0.5 text-[11px] font-medium text-ink-muted">
                  {message.user.name}
                </p>
              )}
              <div
                className={
                  isOwn
                    ? 'rounded-lg rounded-br-sm bg-accent px-3 py-2 text-[13px] text-white'
                    : 'rounded-lg rounded-bl-sm bg-raised px-3 py-2 text-[13px] text-ink-soft'
                }
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              </div>
              <p
                className={`mt-0.5 px-0.5 text-[10px] text-ink-faint ${isOwn ? 'text-right' : ''}`}
              >
                {formatTime(message.createdAt)}
              </p>
            </div>
          );
        })}
      </div>

      {!connected && (
        <div className="border-t border-hairline bg-raised px-3 py-1.5 text-[11px] text-ink-faint">
          Reconectando…
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-hairline p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje…"
          className="w-full min-w-0 rounded-lg border border-hairline-strong bg-sunken px-2.5 py-1.5 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent-soft"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-hi disabled:opacity-50"
          aria-label="Enviar mensaje"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
