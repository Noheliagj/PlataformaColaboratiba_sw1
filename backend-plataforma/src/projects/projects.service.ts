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

export type ProjectRole = 'OWNER' | 'COLLABORATOR';

/** Proyecto tal como se expone al frontend, con el rol del usuario que pide. */
export type ProjectWithRole = Project & { role: ProjectRole };

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

/**
 * RF3 / RF5 / RF6 / RF4 / RF10: gestión de proyectos, del diagrama asociado
 * y de la colaboración (invitación por código + contraseña).
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
  async findAllForUser(userId: string): Promise<ProjectWithRole[]> {
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

    const ownedWithRole: ProjectWithRole[] = owned.map((p) =>
      this.redactInvite({ ...p, role: 'OWNER' }),
    );
    const memberWithRole: ProjectWithRole[] = memberships.map((m) =>
      this.redactInvite({ ...m.project, role: 'COLLABORATOR' }),
    );

    return [...ownedWithRole, ...memberWithRole].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }

  /** Proyecto individual (incluye modelData) para dueño o colaborador. */
  async findOneAccessible(
    userId: string,
    id: string,
  ): Promise<ProjectWithRole> {
    const { project, role } = await this.getAccessibleOrThrow(userId, id);
    return this.redactInvite({ ...project, role });
  }

  /** RF5/RF6: guarda el estado del diagrama (dueño o colaborador pueden editar). */
  async updateModel(
    userId: string,
    id: string,
    dto: UpdateProjectModelDto,
  ): Promise<Project> {
    await this.getAccessibleOrThrow(userId, id);
    return this.prisma.project.update({
      where: { id },
      data: {
        modelData: {
          nodes: dto.nodes,
          edges: dto.edges,
        } as Prisma.InputJsonValue,
      },
    });
  }

  async remove(ownerId: string, id: string): Promise<{ id: string }> {
    await this.getOwnedOrThrow(ownerId, id);
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

  /** Oculta la contraseña de invitación a quien no sea el dueño. */
  private redactInvite(project: ProjectWithRole): ProjectWithRole {
    if (project.role === 'OWNER') return project;
    return { ...project, invitePassword: '' };
  }
}
