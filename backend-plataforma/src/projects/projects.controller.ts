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
import { JoinProjectDto } from './dto/join-project.dto';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  // POST /projects
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) {
    return this.projects.create(user.id, dto);
  }

  // POST /projects/join -> RF4/RF10: unirse con (código, contraseña).
  // Declarado antes de ':id' para que 'join' no se interprete como un id.
  @Post('join')
  join(@CurrentUser() user: AuthUser, @Body() dto: JoinProjectDto) {
    return this.projects.join(user.id, dto);
  }

  // GET /projects -> propios (RF3) + aquellos donde el usuario colabora (RF10)
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.projects.findAllForUser(user.id);
  }

  // GET /projects/:id -> proyecto individual con su modelData (dueño o colaborador)
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projects.findOneAccessible(user.id, id);
  }

  // GET /projects/:id/invite -> RF4: código + contraseña de invitación (solo dueño)
  @Get(':id/invite')
  getInvite(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projects.getInviteInfo(user.id, id);
  }

  // PUT /projects/:id/model -> guarda el diagrama (dueño o colaborador)
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
