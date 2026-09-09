import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';
import { login, saveSession } from '../services/auth';
import { getErrorMessage } from '../services/http-error';
import './auth.css';

/** RF2 - Pantalla de inicio de sesión. */
export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>
          <LogIn size={20} /> Iniciar sesión
        </h1>
        <p className="subtitle">Plataforma de modelado de software</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <div className="auth-input">
            <Mail size={16} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="password">Contraseña</label>
          <div className="auth-input">
            <Lock size={16} />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button className="auth-btn" type="submit" disabled={loading}>
          <LogIn size={16} />
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="auth-foot">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </form>
    </div>
  );
}
