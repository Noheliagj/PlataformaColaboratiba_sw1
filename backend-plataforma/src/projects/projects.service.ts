import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Project } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

/**
 * RF3: gestión de proyectos. Toda operación se hace siempre
 * en el contexto del usuario dueño (ownerId).
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

  async remove(ownerId: string, id: string): Promise<{ id: string }> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    if (project.ownerId !== ownerId) {
      throw new ForbiddenException('No puedes eliminar este proyecto');
    }
    await this.prisma.project.delete({ where: { id } });
    return { id };
  }
}
