import { AuthGuard } from '@nestjs/passport';

/**
 * Guard reutilizable para proteger rutas: `@UseGuards(JwtAuthGuard)`.
 * Delega en la estrategia "jwt" (ver jwt.strategy.ts).
 *
 * Sin `@Injectable()` a propósito: `AuthGuard('jwt')` ya devuelve una clase
 * inyectable con sus dependencias marcadas como opcionales. Volver a decorar
 * la subclase haría que TypeScript re-emitiera metadatos y Nest intentara
 * resolver `AuthModuleOptions` como obligatorio.
 */
export class JwtAuthGuard extends AuthGuard('jwt') {}
