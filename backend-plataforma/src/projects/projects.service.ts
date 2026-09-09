import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectModelDto } from './dto/update-project-model.dto';

/**
 * RF3 / RF5 / RF6: gestión de proyectos y del diagrama asociado.
 * Toda operación se hace siempre en el contexto del usuario dueño (ownerId).
 */
@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  create(ownerId: string, dto: CreateProjectDto): Promise<Project> {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        ownerId,
      },
    });
  }

  findAllByOwner(ownerId: string): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Proyecto individual (incluye modelData) validando propiedad. */
  async findOneByOwner(ownerId: string, id: string): Promise<Project> {
    const project = await this.getOwnedOrThrow(ownerId, id);
    return project;
  }

  /** RF5/RF6: guarda el estado del diagrama en Project.modelData. */
  async updateModel(
    ownerId: string,
    id: string,
    dto: UpdateProjectModelDto,
  ): Promise<Project> {
    await this.getOwnedOrThrow(ownerId, id);
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

  /** Busca el proyecto y comprueba que pertenece al usuario. */
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
}
