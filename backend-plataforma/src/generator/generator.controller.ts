import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt-payload.interface';
import { GeneratorService } from './generator.service';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class GeneratorController {
  constructor(private readonly generator: GeneratorService) {}

  // GET /projects/:id/generate/spring -> descarga el backend Spring Boot
  // generado a partir del modelData (nodes + edges) del proyecto.
  @Get(':id/generate/spring')
  async generateSpring(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { fileName, buffer } = await this.generator.generateSpringProject(
      user.id,
      id,
    );
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
