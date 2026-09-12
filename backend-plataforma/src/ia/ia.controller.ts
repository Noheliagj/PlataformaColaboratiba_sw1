import {
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt-payload.interface';
import { IaService } from './ia.service';
import type { UploadedImageFile } from './ia.service';
import { AiChatDto } from './dto/ai-chat.dto';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

@UseGuards(JwtAuthGuard)
@Controller('projects/:id/ai')
export class IaController {
  constructor(private readonly ia: IaService) {}

  // POST /projects/:id/ai/chat -> RF11: comando en lenguaje natural sobre el diagrama.
  @Post('chat')
  chat(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AiChatDto) {
    return this.ia.chat(user.id, user.name, id, dto.message, dto.history ?? []);
  }

  // POST /projects/:id/ai/import-image -> importación de diagramas por
  // imagen (Vision): sube una foto/captura y la IA reconstruye el diagrama.
  @Post('import-image')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  importImage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() file: UploadedImageFile,
  ) {
    return this.ia.importFromImage(user.id, user.name, id, file);
  }
}
