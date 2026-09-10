import type { InputHTMLAttributes, ReactNode } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  hint?: string;
  error?: string | null;
}

/** Campo de formulario con etiqueta encima, icono opcional y estado de error. */
export function TextField({
  label,
  icon,
  hint,
  error,
  id,
  className = '',
  ...rest
}: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[12px] font-medium text-ink-soft"
      >
        {label}
      </label>
      <div
        className={`flex items-center gap-2.5 rounded-lg border bg-sunken px-3 py-2.5 transition-colors focus-within:ring-2 ${
          error
            ? 'border-critical/55 focus-within:border-critical focus-within:ring-critical-soft'
            : 'border-hairline-strong focus-within:border-accent focus-within:ring-accent-soft'
        }`}
      >
        {icon && <span className="shrink-0 text-ink-faint">{icon}</span>}
        <input
          id={id}
          className={`w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint ${className}`}
          {...rest}
        />
      </div>
      {error ? (
        <p className="text-[12px] text-critical">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
