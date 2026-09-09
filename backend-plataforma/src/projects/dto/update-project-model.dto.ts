/**
 * Cuerpo de PUT /projects/:id/model.
 * Es el estado del diagrama de React Flow tal cual: nodos y aristas.
 * Se guarda íntegro en Project.modelData (columna JSON).
 */
export class UpdateProjectModelDto {
  nodes!: unknown[];
  edges!: unknown[];
}
