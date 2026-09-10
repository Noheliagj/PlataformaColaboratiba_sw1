import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, AlertCircle } from 'lucide-react';
import { register, saveSession } from '../services/auth';
import { getErrorMessage } from '../services/http-error';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { Brand } from '../components/ui/Brand';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** RF1 - Pantalla de registro. */
export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const nameError =
    touched && name.trim().length < 2 ? 'Indica tu nombre' : null;
  const emailError =
    touched && !EMAIL_RE.test(email) ? 'Introduce un email válido' : null;
  const passwordError =
    touched && password.length < 6
      ? 'Mínimo 6 caracteres'
      : null;

  const valid =
    name.trim().length >= 2 && EMAIL_RE.test(email) && password.length >= 6;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setError(null);
    setLoading(true);
    try {
      const res = await register({ name: name.trim(), email, password });
      saveSession(res);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo completar el registro'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Brand size="lg" />
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl shadow-black/40 backdrop-blur"
        >
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-white">Crear cuenta</h1>
            <p className="text-sm text-slate-400">
              Empieza a modelar tu software en minutos.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2.5 text-sm text-rose-300">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <TextField
            id="name"
            label="Nombre"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre"
            icon={<User size={16} />}
            value={name}
            error={nameError}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
          />

          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            icon={<Mail size={16} />}
            value={email}
            error={emailError}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
          />

          <TextField
            id="password"
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            icon={<Lock size={16} />}
            value={password}
            error={passwordError}
            hint="Usa al menos 6 caracteres."
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched(true)}
          />

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            icon={<UserPlus size={16} />}
          >
            {loading ? 'Creando…' : 'Registrarme'}
          </Button>

          <p className="text-center text-sm text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="font-medium text-indigo-400 hover:text-indigo-300"
            >
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
