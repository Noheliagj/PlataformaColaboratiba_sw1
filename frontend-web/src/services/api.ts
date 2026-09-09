import axios from 'axios';

/**
 * URL del backend de la plataforma (NestJS).
 * Se puede sobreescribir con VITE_API_URL en un archivo .env.
 */
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Adjunta el token JWT (si existe) a cada petición.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
