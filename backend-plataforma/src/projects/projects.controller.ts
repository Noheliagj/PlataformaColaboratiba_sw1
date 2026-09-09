import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt-payload.interface';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectModelDto } from './dto/update-project-model.dto';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  // POST /projects
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) {
    return this.projects.create(user.id, dto);
  }

  // GET /projects -> solo los del usuario autenticado
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.projects.findAllByOwner(user.id);
  }

  // GET /projects/:id -> proyecto individual con su modelData
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projects.findOneByOwner(user.id, id);
  }

  // PUT /projects/:id/model -> guarda el diagrama (nodes + edges)
  @Put(':id/model')
  updateModel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectModelDto,
  ) {
    return this.projects.updateModel(user.id, id, dto);
  }

  // DELETE /projects/:id -> comprueba ownerId antes de borrar
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projects.remove(user.id, id);
  }
}
