import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from './jwt-payload.interface';

/**
 * Inyecta el usuario autenticado (lo que devuelve JwtStrategy.validate)
 * en un parámetro del controlador: `metodo(@CurrentUser() user: AuthUser)`.
 * Solo tiene valor si la ruta está protegida con JwtAuthGuard.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
