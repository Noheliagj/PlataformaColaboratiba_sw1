/**
 * Cuerpo de POST /projects/join.
 * RF4/RF10: credenciales para unirse a un proyecto ajeno como colaborador.
 */
export class JoinProjectDto {
  code!: string;
  password!: string;
}
