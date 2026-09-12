import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  DiagramForGenerator,
  DiagramModel,
  ProjectsService,
  StructuredDiagramInput,
} from '../projects/projects.service';
import { DiagramGateway } from '../websockets/diagram.gateway';
import { AI_TOOLS, DIAGRAM_EXTRACTION_TOOL } from './ia-tools';
import { ChatMessageDto } from './dto/ai-chat.dto';

const DEFAULT_MODEL = 'claude-sonnet-5';
// Tope de idas y vueltas herramienta -> resultado -> nueva respuesta, para
// no dejar una conversación en loop infinito si el modelo insiste en llamar
// herramientas sin nunca cerrar con una respuesta de texto.
const MAX_TOOL_ROUNDS = 4;

/** Formatos de imagen que acepta la API de Vision de Anthropic. */
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/** Subconjunto de Express.Multer.File que usa este servicio (ver IaController). */
export interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

interface ToolExecutionResult {
  modelData?: DiagramModel;
  summary?: string;
  error?: string;
}

/**
 * RF11: asistente de IA con function calling. Traduce comandos en lenguaje
 * natural ("Crea la clase Cliente con atributos id y nombre") en llamadas a
 * las mutaciones puntuales de ProjectsService.ai* sobre el modelo
 * relacional (ver projects.service.ts), y retransmite cada cambio en vivo
 * por WebSocket (RF10) para que se vea en el lienzo sin recargar.
 */
@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);
  private readonly client: Anthropic | null;
  private readonly model: string;

  constructor(
    private readonly config: ConfigService,
    private readonly projects: ProjectsService,
    private readonly gateway: DiagramGateway,
  ) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
    this.model = this.config.get<string>('ANTHROPIC_MODEL') || DEFAULT_MODEL;
  }

  async chat(
    userId: string,
    userName: string,
    projectId: string,
    message: string,
    history: ChatMessageDto[],
  ): Promise<{ reply: string; actions: string[] }> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'El asistente de IA no está configurado: falta ANTHROPIC_API_KEY en backend-plataforma/.env.',
      );
    }
    if (!message?.trim()) {
      throw new BadRequestException('El mensaje no puede estar vacío');
    }

    // RF11: le da al modelo el contexto de lo que ya existe en el diagrama,
    // para que pueda resolver a qué clase se refiere el usuario y no
    // duplique clases que ya están creadas.
    const diagram = await this.projects.getDiagramForGenerator(userId, projectId);
    const system = this.buildSystemPrompt(diagram);

    const messages: Anthropic.Messages.MessageParam[] = [
      ...history
        .filter((turn) => turn.content?.trim())
        .map((turn): Anthropic.Messages.MessageParam => ({ role: turn.role, content: turn.content })),
      { role: 'user', content: message },
    ];

    const actions: string[] = [];
    let finalText = '';

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system,
        messages,
        tools: AI_TOOLS,
      });

      const textBlocks = response.content.filter(
        (block): block is Anthropic.Messages.TextBlock => block.type === 'text',
      );
      if (textBlocks.length) {
        finalText = textBlocks.map((block) => block.text).join('\n').trim();
      }

      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use',
      );
      if (toolUseBlocks.length === 0) break;

      messages.push({ role: 'assistant', content: response.content });

      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        const result = await this.executeTool(
          userId,
          projectId,
          block.name,
          (block.input ?? {}) as Record<string, unknown>,
        );
        if (result.summary) actions.push(result.summary);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result.error ? `Error: ${result.error}` : 'Hecho.',
          is_error: Boolean(result.error),
        });
        if (result.modelData) {
          this.gateway.broadcastDiagramUpdate(projectId, result.modelData, { userId, userName });
        }
      }
      messages.push({ role: 'user', content: toolResults });

      if (response.stop_reason !== 'tool_use') break;
    }

    return { reply: finalText || 'Listo.', actions };
  }

  /** Ejecuta una herramienta contra el diagrama real. Nunca lanza: los
   * errores (p.ej. "no existe la clase X") vuelven como tool_result de error
   * para que el modelo se lo explique al usuario en su respuesta. */
  private async executeTool(
    userId: string,
    projectId: string,
    name: string,
    input: Record<string, unknown>,
  ): Promise<ToolExecutionResult> {
    try {
      switch (name) {
        case 'create_class': {
          const { modelData, className } = await this.projects.aiCreateClass(userId, projectId, {
            name: String(input.name ?? ''),
            attributes: input.attributes as Array<{ name: string; type?: string }> | undefined,
            methods: input.methods as
              | Array<{ name: string; returnType?: string; parameters?: string }>
              | undefined,
          });
          return { modelData, summary: `Se creó la clase "${className}".` };
        }
        case 'add_attribute': {
          const className = String(input.className ?? '');
          const { modelData } = await this.projects.aiAddAttribute(userId, projectId, {
            className,
            name: String(input.name ?? ''),
            type: input.type as string | undefined,
          });
          return { modelData, summary: `Se agregó el atributo "${input.name}" a "${className}".` };
        }
        case 'add_method': {
          const className = String(input.className ?? '');
          const { modelData } = await this.projects.aiAddMethod(userId, projectId, {
            className,
            name: String(input.name ?? ''),
            returnType: input.returnType as string | undefined,
            parameters: input.parameters as string | undefined,
          });
          return { modelData, summary: `Se agregó el método "${input.name}" a "${className}".` };
        }
        case 'create_relationship': {
          const source = String(input.sourceClassName ?? '');
          const target = String(input.targetClassName ?? '');
          const { modelData } = await this.projects.aiCreateRelationship(userId, projectId, {
            sourceClassName: source,
            targetClassName: target,
            name: input.name as string | undefined,
            sourceCardinality: input.sourceCardinality as string | undefined,
            targetCardinality: input.targetCardinality as string | undefined,
          });
          return { modelData, summary: `Se creó la relación entre "${source}" y "${target}".` };
        }
        case 'delete_class': {
          const className = String(input.className ?? '');
          const { modelData } = await this.projects.aiDeleteClass(userId, projectId, { className });
          return { modelData, summary: `Se eliminó la clase "${className}".` };
        }
        default:
          return { error: `Herramienta desconocida: ${name}` };
      }
    } catch (err) {
      this.logger.warn(`Fallo ejecutando "${name}": ${(err as Error).message}`);
      return { error: err instanceof Error ? err.message : 'Error desconocido' };
    }
  }

  /**
   * Importación de diagramas por imagen (Vision): interpreta una foto o
   * captura de un diagrama de clases y reemplaza el diagrama del proyecto
   * con lo detectado (ver ProjectsService.importStructuredModel). El cambio
   * se retransmite en vivo por WebSocket igual que las mutaciones de chat
   * (RF10/RF11).
   */
  async importFromImage(
    userId: string,
    userName: string,
    projectId: string,
    file: UploadedImageFile | undefined,
  ): Promise<{ modelData: DiagramModel; summary: string }> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'El asistente de IA no está configurado: falta ANTHROPIC_API_KEY en backend-plataforma/.env.',
      );
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('Debes subir una imagen del diagrama');
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype as AllowedImageType)) {
      throw new BadRequestException(
        'Formato de imagen no soportado (usa PNG, JPG, WEBP o GIF)',
      );
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system:
        'Eres un experto en UML. Analiza la imagen de un diagrama de clases (foto, captura o dibujo a mano) ' +
        'y usa la herramienta "extraer_diagrama" para registrar exactamente lo que ves: no inventes clases, ' +
        'atributos, métodos ni relaciones que no estén presentes en la imagen.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: file.mimetype as AllowedImageType,
                data: file.buffer.toString('base64'),
              },
            },
            {
              type: 'text',
              text: 'Extrae todas las clases (con sus atributos y métodos) y todas las relaciones (con cardinalidad si es visible) de este diagrama de clases UML.',
            },
          ],
        },
      ],
      tools: [DIAGRAM_EXTRACTION_TOOL],
      tool_choice: { type: 'tool', name: 'extraer_diagrama' },
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use',
    );
    const extracted = toolUse?.input as StructuredDiagramInput | undefined;
    if (!extracted?.classes?.length) {
      throw new BadRequestException(
        'No se detectaron clases en la imagen. Prueba con una foto más nítida o mejor encuadrada.',
      );
    }

    const { modelData } = await this.projects.importStructuredModel(
      userId,
      projectId,
      extracted,
      'IMPORT_IMAGE',
    );
    this.gateway.broadcastDiagramUpdate(projectId, modelData, { userId, userName });

    const relCount = extracted.relationships?.length ?? 0;
    return {
      modelData,
      summary:
        `Se importaron ${extracted.classes.length} clase(s)` +
        (relCount ? ` y ${relCount} relación(es)` : '') +
        ' desde la imagen.',
    };
  }

  private buildSystemPrompt(diagram: DiagramForGenerator): string {
    const summary = diagram.classes.length
      ? diagram.classes
          .map(
            (classRow) =>
              `- ${classRow.name}(${classRow.attributes
                .map((attr) => `${attr.name}: ${attr.type}`)
                .join(', ')})`,
          )
          .join('\n')
      : '(el diagrama todavía no tiene clases)';

    return `Eres el asistente de modelado de una plataforma de diagramas de clases UML colaborativa.
El usuario te pide en lenguaje natural crear o modificar clases, atributos, métodos y relaciones del
diagrama actual. Usa siempre las herramientas disponibles para aplicar los cambios reales; nunca digas
que hiciste algo sin haber llamado a la herramienta correspondiente. Si el usuario no da un tipo de
dato, usa "String" para atributos y "void" como retorno de métodos. Responde siempre en español, en
1 o 2 frases, confirmando brevemente qué hiciste (o explicando por qué no se pudo, por ejemplo si
pidió modificar una clase que no existe).

Diagrama actual del proyecto:
${summary}`;
  }
}
