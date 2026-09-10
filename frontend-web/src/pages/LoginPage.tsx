import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { login, saveSession } from '../services/auth';
import { getErrorMessage } from '../services/http-error';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { Brand } from '../components/ui/Brand';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** RF2 - Pantalla de inicio de sesión. */
export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailError =
    touched && !EMAIL_RE.test(email) ? 'Introduce un email válido' : null;
  const passwordError =
    touched && password.length === 0 ? 'La contraseña es obligatoria' : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!EMAIL_RE.test(email) || password.length === 0) return;
    setError(null);
    setLoading(true);
    try {
      const res = await login({ email, password });
      saveSession(res);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo iniciar sesión'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />

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
            <h1 className="text-xl font-semibold text-white">Iniciar sesión</h1>
            <p className="text-sm text-slate-400">
              Accede para continuar con tus diagramas.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2.5 text-sm text-rose-300">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
            autoComplete="current-password"
            placeholder="••••••••"
            icon={<Lock size={16} />}
            value={password}
            error={passwordError}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched(true)}
          />

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            icon={<LogIn size={16} />}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>

          <p className="text-center text-sm text-slate-400">
            ¿No tienes cuenta?{' '}
            <Link
              to="/register"
              className="font-medium text-indigo-400 hover:text-indigo-300"
            >
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
