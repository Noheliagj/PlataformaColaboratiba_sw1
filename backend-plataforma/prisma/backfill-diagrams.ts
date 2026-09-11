/**
 * Migración de datos de una sola vez: RF5/RF6/RF8 pasan de guardarse como
 * `Project.modelData` (JSON de React Flow) a las tablas relacionales
 * Diagram/ClassNode/Attribute/Method/Relationship.
 *
 * Se corre UNA vez, después de aplicar la migración que crea esas tablas
 * (`20260911143144_add_diagram_relational_model`) y ANTES de la migración
 * que elimina la columna `projects.modelData`. Uso (el --compiler-options
 * es necesario porque el script vive fuera de `src/`, el rootDir de
 * tsconfig.json):
 *
 *   npx ts-node --transpile-only --compiler-options "{\"rootDir\":\".\"}" prisma/backfill-diagrams.ts
 *
 * Se deja commiteado como referencia de cómo se migraron los datos
 * existentes (parte de la documentación del cambio de arquitectura).
 */
import { PrismaClient } from '@prisma/client';
import {
  parseAttributeLine,
  parseMethodLine,
} from '../src/common/uml-member.util';

const prisma = new PrismaClient();

interface LegacyNode {
  id: string;
  data?: { name?: string; attributes?: string[]; methods?: string[] };
  position?: { x: number; y: number };
}

interface LegacyEdge {
  id: string;
  source: string;
  target: string;
  data?: {
    relationName?: string;
    sourceCardinality?: string;
    targetCardinality?: string;
  };
}

interface LegacyModel {
  nodes?: LegacyNode[];
  edges?: LegacyEdge[];
}

async function main() {
  const projects = await prisma.project.findMany({
    select: { id: true, name: true, modelData: true },
  });

  console.log(`Proyectos encontrados: ${projects.length}`);

  for (const project of projects) {
    const existingDiagram = await prisma.diagram.findUnique({
      where: { projectId: project.id },
    });
    if (existingDiagram) {
      console.log(
        `- ${project.name} (${project.id}): ya tiene diagrama, se omite`,
      );
      continue;
    }

    const model = (project.modelData ?? {}) as LegacyModel;
    const nodes = model.nodes ?? [];
    const edges = model.edges ?? [];
    const nodeIds = new Set(nodes.map((n) => n.id));

    await prisma.diagram.create({
      data: {
        projectId: project.id,
        classes: {
          create: nodes.map((node) => ({
            id: node.id,
            name: node.data?.name?.trim() || 'Clase',
            positionX: node.position?.x ?? 0,
            positionY: node.position?.y ?? 0,
            attributes: {
              create: (node.data?.attributes ?? [])
                .filter((raw) => raw && raw.trim())
                .map((raw, index) => {
                  const parsed = parseAttributeLine(raw);
                  return { ...parsed, orderIndex: index };
                }),
            },
            methods: {
              create: (node.data?.methods ?? [])
                .filter((raw) => raw && raw.trim())
                .map((raw, index) => {
                  const parsed = parseMethodLine(raw);
                  return { ...parsed, orderIndex: index };
                }),
            },
          })),
        },
        relationships: {
          create: edges
            .filter(
              (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
            )
            .map((edge) => ({
              id: edge.id,
              sourceClassId: edge.source,
              targetClassId: edge.target,
              name: edge.data?.relationName || null,
              sourceCardinality: edge.data?.sourceCardinality || null,
              targetCardinality: edge.data?.targetCardinality || null,
            })),
        },
      },
    });

    console.log(
      `- ${project.name} (${project.id}): migradas ${nodes.length} clase(s), ${edges.length} relación(es)`,
    );
  }

  console.log('Backfill completo.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
