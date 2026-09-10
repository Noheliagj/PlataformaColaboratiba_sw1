import type { InputHTMLAttributes, ReactNode } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  hint?: string;
  error?: string | null;
}

/** Campo de formulario con etiqueta, icono opcional y estado de error visual. */
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
        className="block text-xs font-medium text-slate-300"
      >
        {label}
      </label>
      <div
        className={`flex items-center gap-2.5 rounded-lg border bg-slate-950/60 px-3 py-2.5 transition-colors focus-within:ring-2 ${
          error
            ? 'border-rose-700/70 focus-within:border-rose-600 focus-within:ring-rose-600/20'
            : 'border-slate-700 focus-within:border-indigo-500 focus-within:ring-indigo-500/25'
        }`}
      >
        {icon && <span className="shrink-0 text-slate-500">{icon}</span>}
        <input
          id={id}
          className={`w-full min-w-0 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600 ${className}`}
          {...rest}
        />
      </div>
      {error ? (
        <p className="text-xs text-rose-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
