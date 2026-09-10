/** Marca de la plataforma: isotipo geométrico + wordmark. */
export function Brand({
  size = 'md',
  showTagline = true,
}: {
  size?: 'md' | 'lg';
  showTagline?: boolean;
}) {
  const lg = size === 'lg';
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`relative grid shrink-0 place-items-center rounded-[10px] border border-hairline-strong bg-raised text-accent-hi ${
          lg ? 'h-10 w-10' : 'h-8 w-8'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={lg ? 'h-5 w-5' : 'h-4 w-4'}
          aria-hidden="true"
        >
          <rect
            x="3"
            y="3"
            width="8"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <rect
            x="13"
            y="13"
            width="8"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M11 7h4a2 2 0 0 1 2 2v4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="leading-tight">
        <span
          className={`block font-semibold text-ink ${lg ? 'text-[15px]' : 'text-[13px]'}`}
        >
          UML&nbsp;Studio
        </span>
        {showTagline && (
          <span className="block text-[11px] text-ink-muted">
            Modelado colaborativo
          </span>
        )}
      </span>
    </div>
  );
}
