import type Anthropic from '@anthropic-ai/sdk';

/**
 * RF11: herramientas (function calling) que el asistente puede invocar para
 * operar sobre el diagrama relacional (ver ProjectsService.ai* en
 * projects.service.ts). Cada una corresponde a una operación puntual, no a
 * un reemplazo del diagrama completo.
 */
export const AI_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: 'create_class',
    description:
      'Crea una nueva clase UML en el diagrama actual, opcionalmente con sus atributos y métodos iniciales.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nombre de la clase, en PascalCase (ej. Cliente).',
        },
        attributes: {
          type: 'array',
          description: 'Atributos iniciales de la clase.',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Nombre del atributo (ej. id, nombre).' },
              type: {
                type: 'string',
                description: 'Tipo del atributo (ej. String, int, Long). "String" si no se indica.',
              },
            },
            required: ['name'],
          },
        },
        methods: {
          type: 'array',
          description: 'Métodos iniciales de la clase.',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              returnType: {
                type: 'string',
                description: 'Tipo de retorno. "void" si no se indica.',
              },
              parameters: {
                type: 'string',
                description: 'Parámetros como texto, ej. "id: Long".',
              },
            },
            required: ['name'],
          },
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'add_attribute',
    description: 'Agrega un atributo a una clase que ya existe en el diagrama.',
    input_schema: {
      type: 'object',
      properties: {
        className: { type: 'string', description: 'Nombre exacto de la clase existente.' },
        name: { type: 'string', description: 'Nombre del nuevo atributo.' },
        type: { type: 'string', description: 'Tipo del atributo. "String" si no se indica.' },
      },
      required: ['className', 'name'],
    },
  },
  {
    name: 'add_method',
    description: 'Agrega un método a una clase que ya existe en el diagrama.',
    input_schema: {
      type: 'object',
      properties: {
        className: { type: 'string', description: 'Nombre exacto de la clase existente.' },
        name: { type: 'string', description: 'Nombre del método.' },
        returnType: { type: 'string', description: '"void" si no se indica.' },
        parameters: { type: 'string', description: 'Parámetros como texto, ej. "id: Long".' },
      },
      required: ['className', 'name'],
    },
  },
  {
    name: 'create_relationship',
    description:
      'Crea una asociación entre dos clases existentes del diagrama, con cardinalidad opcional.',
    input_schema: {
      type: 'object',
      properties: {
        sourceClassName: { type: 'string', description: 'Clase de origen (ya existente).' },
        targetClassName: { type: 'string', description: 'Clase de destino (ya existente).' },
        name: { type: 'string', description: 'Nombre de la relación, ej. "pertenece_a".' },
        sourceCardinality: {
          type: 'string',
          description: 'Cardinalidad del lado origen: "1", "0..1", "N" o "0..*".',
        },
        targetCardinality: {
          type: 'string',
          description: 'Cardinalidad del lado destino: "1", "0..1", "N" o "0..*".',
        },
      },
      required: ['sourceClassName', 'targetClassName'],
    },
  },
  {
    name: 'delete_class',
    description: 'Elimina una clase existente del diagrama, junto con sus atributos, métodos y relaciones.',
    input_schema: {
      type: 'object',
      properties: {
        className: { type: 'string', description: 'Nombre exacto de la clase a eliminar.' },
      },
      required: ['className'],
    },
  },
];
