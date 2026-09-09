/**
 * Datos de entrada de POST /auth/register.
 * La validación de formato (class-validator) se añadirá más adelante.
 */
export class RegisterDto {
  email!: string;
  password!: string;
  name!: string;
}
