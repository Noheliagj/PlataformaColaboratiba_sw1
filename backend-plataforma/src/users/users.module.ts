import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

/**
 * UsersModule expone UsersService. PrismaModule es global,
 * por eso no hace falta importarlo aquí.
 */
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
