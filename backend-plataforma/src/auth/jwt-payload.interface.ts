/** Contenido que firmamos dentro del JWT. */
export interface JwtPayload {
  sub: string;
  email: string;
}

/** Usuario ya autenticado que Passport adjunta a `request.user`. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
}
