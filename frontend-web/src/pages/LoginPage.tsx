import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Lock, AlertCircle } from 'lucide-react';
import { login, saveSession } from '../services/auth';
import { getErrorMessage } from '../services/http-error';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { AuthShell } from '../components/ui/AuthShell';

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
    <AuthShell>
      <div className="mb-7 space-y-1.5">
        <h1 className="text-xl font-semibold text-ink">Inicia sesión</h1>
        <p className="text-sm text-ink-muted">
          Accede para continuar con tus diagramas.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-critical/40 bg-critical-soft px-3 py-2.5 text-[13px] text-critical">
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
          placeholder="Tu contraseña"
          icon={<Lock size={16} />}
          value={password}
          error={passwordError}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched(true)}
        />

        <Button
          type="submit"
          className="mt-1 w-full"
          loading={loading}
          icon={!loading && <ArrowRight size={16} />}
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink-muted">
        ¿No tienes cuenta?{' '}
        <Link
          to="/register"
          className="font-medium text-accent-hi transition-colors hover:text-ink"
        >
          Crea una
        </Link>
      </p>
    </AuthShell>
  );
}
