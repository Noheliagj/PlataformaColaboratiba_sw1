/**
 * Cuerpo de PUT /projects/:id/model.
 * Es el estado del diagrama de React Flow tal cual lo produce el editor:
 * nodos (clases) y aristas (asociaciones). ProjectsService.updateModel lo
 * descompone en las tablas relacionales (Diagram/ClassNode/Attribute/
 * Method/Relationship) — ver src/common/uml-member.util.ts para el parseo
 * de las líneas de atributos/métodos.
 */
export class DiagramNodeDto {
  id!: string;
  position?: { x: number; y: number };
  data?: {
    name?: string;
    attributes?: string[];
    methods?: string[];
  };
}

export class DiagramEdgeDto {
  id!: string;
  source!: string;
  target!: string;
  data?: {
    relationName?: string;
    sourceCardinality?: string;
    targetCardinality?: string;
  };
}

export class UpdateProjectModelDto {
  nodes!: DiagramNodeDto[];
  edges!: DiagramEdgeDto[];
}
