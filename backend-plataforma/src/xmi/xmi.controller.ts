import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt-payload.interface';
import { XmiService } from './xmi.service';
import type { UploadedTextFile } from './xmi.service';

const MAX_XMI_BYTES = 4 * 1024 * 1024;

/** RF12/RF13: interoperabilidad XMI 2.1 (Enterprise Architect u otra herramienta UML). */
@UseGuards(JwtAuthGuard)
@Controller('projects/:id/xmi')
export class XmiController {
  constructor(private readonly xmi: XmiService) {}

  // GET /projects/:id/xmi/export -> descarga el diagrama como .xmi
  @Get('export')
  async export(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { fileName, xml } = await this.xmi.exportProject(user.id, id);
    res.set({
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    res.send(xml);
  }

  // POST /projects/:id/xmi/import -> reemplaza el diagrama a partir de un .xmi/.xml
  @Post('import')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_XMI_BYTES } }))
  importXmi(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() file: UploadedTextFile,
  ) {
    return this.xmi.importProject(user.id, user.name, id, file);
  }
}
