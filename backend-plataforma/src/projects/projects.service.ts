import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectModelDto } from './dto/update-project-model.dto';
import { JoinProjectDto } from './dto/join-project.dto';
import {
  formatAttributeLine,
  formatMethodLine,
  parseAttributeLine,
  parseMethodLine,
} from '../common/uml-member.util';

export type ProjectRole = 'OWNER' | 'COLLABORATOR';

/**
 * Forma que consume el editor (React Flow). Es la misma forma que antes se
 * guardaba tal cual en `Project.modelData`; ahora se reconstruye desde las
 * tablas relacionales (Diagram/ClassNode/Attribute/Method/Relationship) en
 * cada lectura, para que el contrato REST no cambie.
 */
export interface DiagramModel {
  nodes: Array<{
    id: string;
    type: 'classNode';
    position: { x: number; y: number };
    data: { name: string; attributes: string[]; methods: string[] };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: 'customEdge';
    data: {
      relationName: string;
      sourceCardinality: string;
      targetCardinality: string;
    };
  }>;
}

/** Proyecto tal como se expone al frontend, con el rol del usuario que pide. */
export type ProjectWithRole = Project & {
  role: ProjectRole;
  modelData: DiagramModel;
};

/** RF9: una entrada del historial de guardados (GET /projects/:id/history). */
export interface ProjectActivityEntry {
  id: string;
  action: string;
  createdAt: Date;
  user: { id: string; name: string };
}

/** Filas normalizadas para el generador Spring Boot (RF7/RF14): sin pasar
 * por el formateo a string que usa el editor (ver getDiagramForGenerator). */
export interface DiagramForGenerator {
  projectName: string;
  classes: Array<{
    id: string;
    name: string;
    attributes: Array<{ name: string; type: string }>;
  }>;
  relationships: Array<{
    sourceClassId: string;
    targetClassId: string;
    name: string | null;
    sourceCardinality: string | null;
    targetCardinality: string | null;
  }>;
}

const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I

function generateInviteCode(length = 8): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += INVITE_CODE_CHARS.charAt(
      Math.floor(Math.random() * INVITE_CODE_CHARS.length),
    );
  }
  return code;
}

/** RF4: contraseña numérica de 6 dígitos para acompañar el código de invitación. */
function generateInvitePassword(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const DIAGRAM_INCLUDE = {
  classes: {
    include: {
      attributes: { orderBy: { orderIndex: 'asc' as const } },
      methods: { orderBy: { orderIndex: 'asc' as const } },
    },
  },
  relationships: true,
} satisfies Prisma.DiagramInclude;

/**
 * RF3 / RF5 / RF6 / RF4 / RF10: gestión de proyectos, del diagrama asociado
 * (guardado de forma relacional, ver DiagramModel arriba) y de la
 * colaboración (invitación por código + contraseña).
 *
 * El acceso de LECTURA/ESCRITURA sobre el diagrama lo tiene el dueño y
 * cualquier colaborador que se haya unido (ProjectMember). Operaciones
 * sensibles (eliminar, ver credenciales de invitación) siguen siendo
 * exclusivas del dueño.
 */
@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateProjectDto): Promise<Project> {
    // Reintenta si el código de invitación colisiona (muy improbable, 8
    // caracteres de un alfabeto de 33 símbolos).
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await this.prisma.project.create({
          data: {
            name: dto.name,
            description: dto.description,
            ownerId,
            inviteCode: generateInviteCode(),
            invitePassword: generateInvitePassword(),
            // RF5: cada proyecto nace con su diagrama (vacío) — es un 1:1,
            // no hace falta crearlo "on demand" al primer guardado.
            diagram: { create: {} },
          },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002' &&
          attempt < 4
        ) {
          continue;
        }
        throw err;
      }
    }
    throw new BadRequestException(
      'No se pudo generar un código de invitación único',
    );
  }

  /** RF3: proyectos propios + RF10: proyectos ajenos donde el usuario colabora. */
  async findAllForUser(
    userId: string,
  ): Promise<Array<Project & { role: ProjectRole }>> {
    const [owned, memberships] = await Promise.all([
      this.prisma.project.findMany({
        where: { ownerId: userId },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.projectMember.findMany({
        where: { userId },
        include: { project: true },
        orderBy: { project: { updatedAt: 'desc' } },
      }),
    ]);

    const ownedWithRole = owned.map((p) =>
      this.redactInvite({ ...p, role: 'OWNER' as const }),
    );
    const memberWithRole = memberships.map((m) =>
      this.redactInvite({ ...m.project, role: 'COLLABORATOR' as const }),
    );

    return [...ownedWithRole, ...memberWithRole].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }

  /** Proyecto individual (incluye el diagrama) para dueño o colaborador. */
  async findOneAccessible(
    userId: string,
    id: string,
  ): Promise<ProjectWithRole> {
    const { role } = await this.getAccessibleOrThrow(userId, id);
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id },
    });
    return this.redactInvite({
      ...project,
      role,
      modelData: await this.getModelData(id),
    });
  }

  /**
   * RF5/RF6/RF9: guarda el diagrama completo (dueño o colaborador pueden
   * editar). Reemplazo transaccional total: se borran las clases/relaciones
   * previas del diagrama y se recrean con lo que manda el editor — mismo
   * patrón "guardar el estado completo" que antes usaba Project.modelData,
   * ahora sobre tablas relacionales en vez de un JSON.
   */
  async updateModel(
    userId: string,
    id: string,
    dto: UpdateProjectModelDto,
  ): Promise<ProjectWithRole> {
    await this.getAccessibleOrThrow(userId, id);

    await this.prisma.$transaction(async (tx) => {
      // Todo proyecto tiene su diagrama desde que se creó (ver create()).
      const diagram = await tx.diagram.findUniqueOrThrow({
        where: { projectId: id },
      });

      // Las relaciones se borran antes que las clases por las FKs; borrar
      // las clases además arrastra en cascada sus atributos/métodos.
      await tx.relationship.deleteMany({ where: { diagramId: diagram.id } });
      await tx.classNode.deleteMany({ where: { diagramId: diagram.id } });

      const nodeIds = new Set(dto.nodes.map((node) => node.id));

      for (const node of dto.nodes) {
        await tx.classNode.create({
          data: {
            id: node.id,
            diagramId: diagram.id,
            name: node.data?.name?.trim() || 'Clase',
            positionX: node.position?.x ?? 0,
            positionY: node.position?.y ?? 0,
            attributes: {
              create: (node.data?.attributes ?? [])
                .filter((raw) => raw && raw.trim())
                .map((raw, index) => ({
                  ...parseAttributeLine(raw),
                  orderIndex: index,
                })),
            },
            methods: {
              create: (node.data?.methods ?? [])
                .filter((raw) => raw && raw.trim())
                .map((raw, index) => ({
                  ...parseMethodLine(raw),
                  orderIndex: index,
                })),
            },
          },
        });
      }

      // Aristas huérfanas (nodo eliminado en el mismo guardado): se
      // descartan, igual que ya hacía defensivamente el generador.
      const validEdges = dto.edges.filter(
        (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
      );
      if (validEdges.length) {
        await tx.relationship.createMany({
          data: validEdges.map((edge) => ({
            id: edge.id,
            diagramId: diagram.id,
            sourceClassId: edge.source,
            targetClassId: edge.target,
            name: edge.data?.relationName || null,
            sourceCardinality: edge.data?.sourceCardinality || null,
            targetCardinality: edge.data?.targetCardinality || null,
          })),
        });
      }

      // RF9: refleja el guardado en Project.updatedAt (lo usa el dashboard).
      await tx.project.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      // RF9: historial — queda registro de quién guardó y cuándo.
      await tx.projectActivity.create({
        data: { projectId: id, userId, action: 'SAVE_DIAGRAM' },
      });
    });

    return this.findOneAccessible(userId, id);
  }

  async remove(ownerId: string, id: string): Promise<{ id: string }> {
    await this.getOwnedOrThrow(ownerId, id);
    // Cascada: Project -> Diagram -> ClassNode -> Attribute/Method/Relationship.
    await this.prisma.project.delete({ where: { id } });
    return { id };
  }

  /** RF4: credenciales de invitación — solo visibles para el dueño. */
  async getInviteInfo(
    ownerId: string,
    id: string,
  ): Promise<{ inviteCode: string; invitePassword: string }> {
    const project = await this.getOwnedOrThrow(ownerId, id);
    return {
      inviteCode: project.inviteCode,
      invitePassword: project.invitePassword,
    };
  }

  /** RF4/RF10: valida (código, contraseña) y une al usuario como colaborador. */
  async join(
    userId: string,
    dto: JoinProjectDto,
  ): Promise<{ id: string; name: string; role: ProjectRole }> {
    const code = dto.code?.trim().toUpperCase();
    const password = dto.password?.trim();
    if (!code || !password) {
      throw new BadRequestException('Código y contraseña son obligatorios');
    }

    const project = await this.prisma.project.findUnique({
      where: { inviteCode: code },
    });
    if (!project || project.invitePassword !== password) {
      throw new ForbiddenException('Código o contraseña incorrectos');
    }

    if (project.ownerId === userId) {
      return { id: project.id, name: project.name, role: 'OWNER' };
    }

    await this.prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId } },
      create: { projectId: project.id, userId },
      update: {},
    });

    return { id: project.id, name: project.name, role: 'COLLABORATOR' };
  }

  /** RF9: historial de guardados del diagrama (dueño o colaborador pueden verlo). */
  async getHistory(
    userId: string,
    id: string,
    limit = 50,
  ): Promise<ProjectActivityEntry[]> {
    await this.getAccessibleOrThrow(userId, id);
    const activities = await this.prisma.projectActivity.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { id: true, name: true } } },
    });
    return activities.map((activity) => ({
      id: activity.id,
      action: activity.action,
      createdAt: activity.createdAt,
      user: activity.user,
    }));
  }

  /**
   * RF7/RF14: filas normalizadas listas para el generador Spring Boot, sin
   * pasar por el formateo a string que usa el editor (evita un viaje
   * structured -> string -> structured innecesario).
   */
  async getDiagramForGenerator(
    userId: string,
    id: string,
  ): Promise<DiagramForGenerator> {
    const { project } = await this.getAccessibleOrThrow(userId, id);
    const diagram = await this.prisma.diagram.findUnique({
      where: { projectId: id },
      include: {
        classes: {
          include: { attributes: { orderBy: { orderIndex: 'asc' } } },
        },
        relationships: true,
      },
    });
    if (!diagram)
      return { projectName: project.name, classes: [], relationships: [] };

    return {
      projectName: project.name,
      classes: diagram.classes.map((classRow) => ({
        id: classRow.id,
        name: classRow.name,
        attributes: classRow.attributes.map((attr) => ({
          name: attr.name,
          type: attr.type,
        })),
      })),
      relationships: diagram.relationships.map((rel) => ({
        sourceClassId: rel.sourceClassId,
        targetClassId: rel.targetClassId,
        name: rel.name,
        sourceCardinality: rel.sourceCardinality,
        targetCardinality: rel.targetCardinality,
      })),
    };
  }

  /**
   * RF11: mutaciones puntuales sobre el diagrama para el asistente de IA
   * (ver src/ia). A diferencia de updateModel (reemplazo total del
   * diagrama), cada una toca solo lo que pide el comando en lenguaje
   * natural sin afectar el resto — así el asistente puede "crear la clase
   * Cliente" sin arriesgar el resto del diagrama. Todas devuelven el
   * modelData actualizado para que el asistente lo retransmita por
   * WebSocket (RF10) a los demás colaboradores conectados.
   */
  async aiCreateClass(
    userId: string,
    id: string,
    input: {
      name: string;
      attributes?: Array<{ name: string; type?: string }>;
      methods?: Array<{
        name: string;
        returnType?: string;
        parameters?: string;
      }>;
    },
  ): Promise<{ modelData: DiagramModel; className: string }> {
    const diagram = await this.getOwnDiagramOrThrow(userId, id);
    const classRow = await this.prisma.classNode.create({
      data: {
        diagramId: diagram.id,
        name: input.name.trim() || 'Clase',
        // Posición aproximada y aleatoria: el usuario la puede arrastrar
        // luego en el lienzo; evita que todas las clases de la IA queden
        // amontonadas en el mismo punto.
        positionX: 80 + Math.random() * 420,
        positionY: 80 + Math.random() * 320,
        attributes: {
          create: (input.attributes ?? []).map((attr, index) => ({
            name: attr.name.trim() || `campo${index + 1}`,
            type: attr.type?.trim() || 'String',
            orderIndex: index,
          })),
        },
        methods: {
          create: (input.methods ?? []).map((method, index) => ({
            name: method.name.trim() || `metodo${index + 1}`,
            returnType: method.returnType?.trim() || 'void',
            parameters: method.parameters?.trim() || '',
            orderIndex: index,
          })),
        },
      },
    });
    return { modelData: await this.getModelData(id), className: classRow.name };
  }

  async aiAddAttribute(
    userId: string,
    id: string,
    input: { className: string; name: string; type?: string },
  ): Promise<{ modelData: DiagramModel }> {
    const diagram = await this.getOwnDiagramOrThrow(userId, id);
    const classRow = await this.findClassByName(diagram.id, input.className);
    const orderIndex = await this.prisma.attribute.count({
      where: { classId: classRow.id },
    });
    await this.prisma.attribute.create({
      data: {
        classId: classRow.id,
        name: input.name.trim() || 'campo',
        type: input.type?.trim() || 'String',
        orderIndex,
      },
    });
    return { modelData: await this.getModelData(id) };
  }

  async aiAddMethod(
    userId: string,
    id: string,
    input: {
      className: string;
      name: string;
      returnType?: string;
      parameters?: string;
    },
  ): Promise<{ modelData: DiagramModel }> {
    const diagram = await this.getOwnDiagramOrThrow(userId, id);
    const classRow = await this.findClassByName(diagram.id, input.className);
    const orderIndex = await this.prisma.method.count({
      where: { classId: classRow.id },
    });
    await this.prisma.method.create({
      data: {
        classId: classRow.id,
        name: input.name.trim() || 'metodo',
        returnType: input.returnType?.trim() || 'void',
        parameters: input.parameters?.trim() || '',
        orderIndex,
      },
    });
    return { modelData: await this.getModelData(id) };
  }

  async aiCreateRelationship(
    userId: string,
    id: string,
    input: {
      sourceClassName: string;
      targetClassName: string;
      name?: string;
      sourceCardinality?: string;
      targetCardinality?: string;
    },
  ): Promise<{ modelData: DiagramModel }> {
    const diagram = await this.getOwnDiagramOrThrow(userId, id);
    const source = await this.findClassByName(
      diagram.id,
      input.sourceClassName,
    );
    const target = await this.findClassByName(
      diagram.id,
      input.targetClassName,
    );
    await this.prisma.relationship.create({
      data: {
        diagramId: diagram.id,
        sourceClassId: source.id,
        targetClassId: target.id,
        name: input.name?.trim() || null,
        sourceCardinality: input.sourceCardinality?.trim() || null,
        targetCardinality: input.targetCardinality?.trim() || null,
      },
    });
    return { modelData: await this.getModelData(id) };
  }

  async aiDeleteClass(
    userId: string,
    id: string,
    input: { className: string },
  ): Promise<{ modelData: DiagramModel }> {
    const diagram = await this.getOwnDiagramOrThrow(userId, id);
    const classRow = await this.findClassByName(diagram.id, input.className);
    // Cascada: se borran también sus atributos/métodos y las relaciones
    // donde esta clase era origen o destino.
    await this.prisma.classNode.delete({ where: { id: classRow.id } });
    return { modelData: await this.getModelData(id) };
  }

  /** Diagrama del proyecto (dueño o colaborador), ya listo para React Flow. */
  private async getModelData(projectId: string): Promise<DiagramModel> {
    const diagram = await this.prisma.diagram.findUnique({
      where: { projectId },
      include: DIAGRAM_INCLUDE,
    });
    return diagram ? this.toDiagramModel(diagram) : { nodes: [], edges: [] };
  }

  /** Valida acceso y devuelve el Diagram del proyecto (siempre existe, ver create()). */
  private async getOwnDiagramOrThrow(userId: string, projectId: string) {
    await this.getAccessibleOrThrow(userId, projectId);
    return this.prisma.diagram.findUniqueOrThrow({ where: { projectId } });
  }

  /** Busca una clase del diagrama por nombre (sin distinguir mayúsculas). */
  private async findClassByName(diagramId: string, name: string) {
    const trimmed = name.trim();
    const classRow = await this.prisma.classNode.findFirst({
      where: { diagramId, name: { equals: trimmed, mode: 'insensitive' } },
    });
    if (!classRow) {
      throw new NotFoundException(
        `No existe una clase llamada "${trimmed}" en este diagrama`,
      );
    }
    return classRow;
  }

  /** Busca el proyecto y comprueba que pertenece al usuario (dueño). */
  private async getOwnedOrThrow(ownerId: string, id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    if (project.ownerId !== ownerId) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
    return project;
  }

  /** Busca el proyecto y comprueba que el usuario es dueño o colaborador. */
  async getAccessibleOrThrow(
    userId: string,
    id: string,
  ): Promise<{ project: Project; role: ProjectRole }> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    if (project.ownerId === userId) {
      return { project, role: 'OWNER' };
    }
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
    return { project, role: 'COLLABORATOR' };
  }

  /** Convierte el diagrama relacional a la forma { nodes, edges } de React Flow. */
  private toDiagramModel(diagram: {
    classes: Array<{
      id: string;
      name: string;
      positionX: number;
      positionY: number;
      attributes: Array<{ name: string; type: string }>;
      methods: Array<{ name: string; parameters: string; returnType: string }>;
    }>;
    relationships: Array<{
      id: string;
      sourceClassId: string;
      targetClassId: string;
      name: string | null;
      sourceCardinality: string | null;
      targetCardinality: string | null;
    }>;
  }): DiagramModel {
    return {
      nodes: diagram.classes.map((classRow) => ({
        id: classRow.id,
        type: 'classNode',
        position: { x: classRow.positionX, y: classRow.positionY },
        data: {
          name: classRow.name,
          attributes: classRow.attributes.map(formatAttributeLine),
          methods: classRow.methods.map(formatMethodLine),
        },
      })),
      edges: diagram.relationships.map((rel) => ({
        id: rel.id,
        source: rel.sourceClassId,
        target: rel.targetClassId,
        type: 'customEdge',
        data: {
          relationName: rel.name ?? '',
          sourceCardinality: rel.sourceCardinality ?? '',
          targetCardinality: rel.targetCardinality ?? '',
        },
      })),
    };
  }

  /** Oculta la contraseña de invitación a quien no sea el dueño. */
  private redactInvite<T extends { role: ProjectRole; invitePassword: string }>(
    project: T,
  ): T {
    if (project.role === 'OWNER') return project;
    return { ...project, invitePassword: '' };
  }
}
