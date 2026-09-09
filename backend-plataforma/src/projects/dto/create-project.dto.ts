/**
 * Datos de entrada de POST /projects.
 * La validación de formato (class-validator) se añadirá más adelante.
 */
export class CreateProjectDto {
  name!: string;
  description?: string;
}
