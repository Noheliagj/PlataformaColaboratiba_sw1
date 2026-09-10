import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { GeneratorController } from './generator.controller';
import { GeneratorService } from './generator.service';

/**
 * RF7 (motor de generación): expone la descarga del backend Spring Boot
 * generado a partir del modelData de un proyecto. Reutiliza ProjectsService
 * (vía ProjectsModule) para la carga + validación de propiedad del proyecto.
 */
@Module({
  imports: [AuthModule, ProjectsModule],
  controllers: [GeneratorController],
  providers: [GeneratorService],
})
export class GeneratorModule {}
