import { BadRequestException, Injectable } from '@nestjs/common';
import { DiagramModel, ProjectsService } from '../projects/projects.service';
import { DiagramGateway } from '../websockets/diagram.gateway';
import { buildXmi } from './xmi-builder.util';
import { parseXmi } from './xmi-parser.util';

/** Subconjunto de Express.Multer.File que usa este servicio (ver XmiController). */
export interface UploadedTextFile {
  buffer: Buffer;
}

/** RF12/RF13: exportación e importación XMI 2.1 (interoperabilidad con Enterprise Architect). */
@Injectable()
export class XmiService {
  constructor(
    private readonly projects: ProjectsService,
    private readonly gateway: DiagramGateway,
  ) {}

  /** RF12: GET /projects/:id/xmi/export. */
  async exportProject(userId: string, id: string): Promise<{ fileName: string; xml: string }> {
    const diagram = await this.projects.getDiagramForXmi(userId, id);
    return { fileName: `${slugify(diagram.projectName)}.xmi`, xml: buildXmi(diagram) };
  }

  /** RF13: POST /projects/:id/xmi/import. */
  async importProject(
    userId: string,
    userName: string,
    id: string,
    file: UploadedTextFile | undefined,
  ): Promise<{ modelData: DiagramModel; importedClasses: number }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Debes subir un archivo .xmi o .xml');
    }

    const structured = parseXmi(file.buffer.toString('utf-8'));
    if (!structured.classes.length) {
      throw new BadRequestException(
        'El archivo no contiene clases UML reconocibles (uml:Class dentro de packagedElement)',
      );
    }

    const { modelData } = await this.projects.importStructuredModel(
      userId,
      id,
      structured,
      'IMPORT_XMI',
    );
    this.gateway.broadcastDiagramUpdate(id, modelData, { userId, userName });

    return { modelData, importedClasses: structured.classes.length };
  }
}

/** Debe coincidir con el slug que usa el frontend para nombrar la descarga. */
function slugify(name: string): string {
  const slug = stripDiacritics(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'proyecto';
}

const DIACRITICS_RANGE = new RegExp(
  '[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']',
  'g',
);

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(DIACRITICS_RANGE, '');
}
