import { Boxes } from 'lucide-react';

/** Marca de la plataforma: isotipo + nombre. */
export function Brand({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const lg = size === 'lg';
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`grid place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-950/40 ${
          lg ? 'h-11 w-11' : 'h-9 w-9'
        }`}
      >
        <Boxes size={lg ? 24 : 20} />
      </span>
      <span className="leading-tight">
        <span
          className={`block font-semibold text-white ${lg ? 'text-lg' : 'text-sm'}`}
        >
          UML Studio
        </span>
        <span className="block text-[11px] text-slate-400">
          Plataforma de modelado
        </span>
      </span>
    </div>
  );
}
