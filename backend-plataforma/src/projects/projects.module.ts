import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

/**
 * RF3. Importa AuthModule para reutilizar la configuración de Passport
 * (necesaria para JwtAuthGuard). PrismaModule es global.
 */
@Module({
  imports: [AuthModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
