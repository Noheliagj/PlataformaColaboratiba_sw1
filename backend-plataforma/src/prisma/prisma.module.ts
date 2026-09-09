import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Módulo global: expone PrismaService a toda la aplicación
 * sin necesidad de re-importarlo en cada módulo de features.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
