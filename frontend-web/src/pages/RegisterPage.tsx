import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, User, Mail, Lock, AlertCircle } from 'lucide-react';
import { register, saveSession } from '../services/auth';
import { getErrorMessage } from '../services/http-error';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { AuthShell } from '../components/ui/AuthShell';

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
    touched && password.length < 6 ? 'Mínimo 6 caracteres' : null;

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
    <AuthShell>
      <div className="mb-7 space-y-1.5">
        <h1 className="text-xl font-semibold text-ink">Crea tu cuenta</h1>
        <p className="text-sm text-ink-muted">
          Empieza a modelar tu software en minutos.
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
          placeholder="Al menos 6 caracteres"
          icon={<Lock size={16} />}
          value={password}
          error={passwordError}
          hint="Usa al menos 6 caracteres."
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched(true)}
        />

        <Button
          type="submit"
          className="mt-1 w-full"
          loading={loading}
          icon={!loading && <ArrowRight size={16} />}
        >
          {loading ? 'Creando…' : 'Crear cuenta'}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink-muted">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/login"
          className="font-medium text-accent-hi transition-colors hover:text-ink"
        >
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
