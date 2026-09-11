import { Visibility } from '@prisma/client';

/**
 * RF6: el editor sigue guardando atributos y métodos como un solo string
 * libre por línea (ver Sidebar.tsx del frontend, que no cambia). Este
 * util es el único lugar que sabe convertir esas líneas hacia/desde las
 * columnas relacionales (Attribute/Method) — se usa al guardar
 * (ProjectsService.updateModel) y al leer (ProjectsService.findOneAccessible).
 *
 * Convención (igual a la que ya usaba generator.service.ts antes de este
 * cambio): prefijo de visibilidad UML opcional (-+#~) y "nombre: tipo".
 */

const VISIBILITY_SYMBOLS: Record<string, Visibility> = {
  '+': Visibility.PUBLIC,
  '-': Visibility.PRIVATE,
  '#': Visibility.PROTECTED,
  '~': Visibility.PACKAGE,
};

function extractVisibility(trimmed: string, fallback: Visibility): Visibility {
  return VISIBILITY_SYMBOLS[trimmed.charAt(0)] ?? fallback;
}

export interface ParsedAttribute {
  name: string;
  type: string;
  visibility: Visibility;
}

export interface ParsedMethod {
  name: string;
  returnType: string;
  parameters: string;
  visibility: Visibility;
}

/** "−nombre: String" | "nombre: String" | "nombre" -> {name, type, visibility}. */
export function parseAttributeLine(raw: string): ParsedAttribute {
  const trimmed = (raw ?? '').trim();
  const visibility = extractVisibility(trimmed, Visibility.PRIVATE);
  const withoutVisibility = trimmed.replace(/^[-+#~]\s*/, '');
  const [namePart, typePart] = withoutVisibility.split(':');
  return {
    name: (namePart ?? '').trim() || 'campo',
    type: (typePart ?? '').trim() || 'String',
    visibility,
  };
}

/**
 * Inverso de parseAttributeLine. No reintroduce el símbolo de visibilidad:
 * el editor actual no lo muestra ni lo pide (Sidebar.tsx no distingue
 * visibilidad), así que reponerlo cambiaría el texto que el usuario ve sin
 * que lo haya escrito él.
 */
export function formatAttributeLine(attr: {
  name: string;
  type: string;
}): string {
  return `${attr.name}: ${attr.type}`;
}

/** "+calcular(x: int): Double" | "calcular(): void" | "calcular" -> estructurado. */
export function parseMethodLine(raw: string): ParsedMethod {
  const trimmed = (raw ?? '').trim();
  const visibility = extractVisibility(trimmed, Visibility.PUBLIC);
  const withoutVisibility = trimmed.replace(/^[-+#~]\s*/, '');

  const withParens = withoutVisibility.match(
    /^([^(:]*)\(([^)]*)\)\s*:?\s*(.*)$/,
  );
  if (withParens) {
    const [, namePart, paramsPart, returnPart] = withParens;
    return {
      name: namePart.trim() || 'metodo',
      parameters: paramsPart.trim(),
      returnType: returnPart.trim() || 'void',
      visibility,
    };
  }

  // Sin paréntesis: se acepta "nombre: tipoRetorno" o solo "nombre".
  const [namePart, returnPart] = withoutVisibility.split(':');
  return {
    name: (namePart ?? '').trim() || 'metodo',
    parameters: '',
    returnType: (returnPart ?? '').trim() || 'void',
    visibility,
  };
}

/** Inverso de parseMethodLine (mismo criterio que formatAttributeLine). */
export function formatMethodLine(method: {
  name: string;
  parameters: string;
  returnType: string;
}): string {
  return `${method.name}(${method.parameters}): ${method.returnType}`;
}
