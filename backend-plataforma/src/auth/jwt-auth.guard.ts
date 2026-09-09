import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard reutilizable para proteger rutas: `@UseGuards(JwtAuthGuard)`.
 * Delega en la estrategia "jwt" (ver jwt.strategy.ts).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
