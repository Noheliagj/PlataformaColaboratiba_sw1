import { Navigate, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { clearSession, getStoredUser } from '../services/auth';
import './auth.css';

/**
 * Placeholder tras autenticarse. Sirve para comprobar que el login/registro
 * funciona de punta a punta. Se sustituirá por el listado de proyectos (RF3).
 */
export function HomePage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    clearSession();
    navigate('/login');
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Sesión iniciada</h1>
        <p className="subtitle">Autenticado contra el backend NestJS</p>
        <div className="auth-ok">
          {user.name} — {user.email}
        </div>
        <button className="auth-btn" type="button" onClick={handleLogout}>
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}
