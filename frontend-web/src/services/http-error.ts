import axios from 'axios';

/** Extrae el mensaje de error legible de una respuesta del backend NestJS. */
export function getErrorMessage(err: unknown, fallback = 'Ocurrió un error'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join(', ');
    if (data?.message) return data.message;
    return err.message;
  }
  return fallback;
}
