import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Lock } from 'lucide-react';
import { register, saveSession } from '../services/auth';
import { getErrorMessage } from '../services/http-error';
import './auth.css';

/** RF1 - Pantalla de registro. */
export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await register({ name, email, password });
      saveSession(res);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo completar el registro'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>
          <UserPlus size={20} /> Crear cuenta
        </h1>
        <p className="subtitle">Plataforma de modelado de software</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field">
          <label htmlFor="name">Nombre</label>
          <div className="auth-input">
            <User size={16} />
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

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
              minLength={6}
              required
            />
          </div>
        </div>

        <button className="auth-btn" type="submit" disabled={loading}>
          <UserPlus size={16} />
          {loading ? 'Creando…' : 'Registrarme'}
        </button>

        <p className="auth-foot">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}
