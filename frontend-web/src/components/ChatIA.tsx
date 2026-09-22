import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Loader2, Mic, MicOff, Send, Sparkles, X } from 'lucide-react';
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

/**
 * RF18: soporte de voz vía Web Speech API. No forma parte del DOM estándar
 * de TypeScript (es experimental, con prefijo "webkit" en Chrome/Edge), así
 * que se declara aquí el subconjunto mínimo que usa este componente en vez
 * de traer una librería solo para los tipos.
 */
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
  resultIndex: number;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** RF11 - Asistente de IA: comandos en lenguaje natural sobre el diagrama. */
export function ChatIA({ open, projectId, onClose }: ChatIAProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // RF18: comandos por voz (Web Speech API del navegador).
  const [listening, setListening] = useState(false);
  const [voiceSupported] = useState(() => getSpeechRecognitionCtor() !== null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  // Si se cierra el panel, corta cualquier reconocimiento en curso: `stop()`
  // dispara `onend` (ver más abajo), que ya deja `listening` en false, así
  // que no hace falta un setState síncrono aquí también.
  useEffect(() => {
    if (!open) {
      recognitionRef.current?.stop();
    }
  }, [open]);

  // Al desmontar el componente, corta el micrófono si seguía activo.
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  if (!open) return null;

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const history: ChatMessage[] = messages.map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setError(null);
    setSending(true);
    try {
      const result = await sendAiMessage(projectId, trimmed, history);
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

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  /**
   * RF18: al hablar, el texto se transcribe en vivo en el input; cuando el
   * navegador entrega el resultado final, se envía automáticamente a la IA
   * (mismo camino que si el usuario lo hubiera escrito y enviado a mano).
   */
  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError('Este navegador no soporta comandos por voz (usa Chrome o Edge).');
      return;
    }

    const recognition = new Ctor();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = '';
      let isFinal = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        transcript += result[0].transcript;
        if (result.isFinal) isFinal = true;
      }
      setInput(transcript);
      if (isFinal && transcript.trim()) {
        void sendMessage(transcript);
      }
    };
    recognition.onerror = () => {
      setError('No se pudo escuchar el micrófono. Revisa los permisos del navegador.');
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setError(null);
    recognition.start();
    setListening(true);
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
        {voiceSupported && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={sending}
            title={listening ? 'Detener dictado' : 'Hablar un comando'}
            aria-label={listening ? 'Detener dictado' : 'Hablar un comando'}
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors disabled:opacity-50 ${
              listening
                ? 'animate-pulse border-critical/50 bg-critical-soft text-critical'
                : 'border-hairline-strong bg-raised text-ink-soft hover:bg-overlay hover:text-ink'
            }`}
          >
            {listening ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? 'Escuchando…' : 'Escribe un comando…'}
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
