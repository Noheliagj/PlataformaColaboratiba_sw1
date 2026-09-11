import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt-payload.interface';
import { IaService } from './ia.service';
import { AiChatDto } from './dto/ai-chat.dto';

@UseGuards(JwtAuthGuard)
@Controller('projects/:id/ai')
export class IaController {
  constructor(private readonly ia: IaService) {}

  // POST /projects/:id/ai/chat -> RF11: comando en lenguaje natural sobre el diagrama.
  @Post('chat')
  chat(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AiChatDto) {
    return this.ia.chat(user.id, user.name, id, dto.message, dto.history ?? []);
  }
}
