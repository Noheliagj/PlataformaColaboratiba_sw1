/**
 * Parser/serializador XML minimalista, sin dependencias externas (ver regla
 * 13 de CONTEXT.md: no instalar dependencias que no sean estrictamente
 * necesarias). Cubre exactamente lo que necesita el subconjunto de XMI 2.1
 * de esta plataforma (RF12/RF13, ver xmi-builder.util.ts y
 * xmi-parser.util.ts): elementos con atributos, anidamiento y texto. No
 * soporta CDATA, DOCTYPE ni namespaces reales (un prefijo como "xmi:type"
 * se trata como texto literal del nombre, que es como XMI los usa igual).
 */

export interface XmlElement {
  tag: string;
  attrs: Record<string, string>;
  children: XmlElement[];
}

/** Parsea un documento XML completo y devuelve un nodo raíz sintético (#root). */
export function parseXml(source: string): XmlElement {
  const clean = source
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const root: XmlElement = { tag: '#root', attrs: {}, children: [] };
  const stack: XmlElement[] = [root];

  const tagRe = /<([^>]+)>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRe.exec(clean))) {
    const raw = match[1].trim();
    if (!raw) continue;

    if (raw.startsWith('/')) {
      if (stack.length > 1) stack.pop();
      continue;
    }

    const selfClosing = raw.endsWith('/');
    const body = selfClosing ? raw.slice(0, -1).trim() : raw;
    const nameMatch = body.match(/^([\w:.-]+)/);
    const tag = nameMatch ? nameMatch[1] : body;
    const attrs = parseAttrs(body.slice(tag.length));

    const el: XmlElement = { tag, attrs, children: [] };
    stack[stack.length - 1].children.push(el);
    if (!selfClosing) stack.push(el);
  }

  return root;
}

function parseAttrs(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRe = /([\w:.-]+)\s*=\s*"([^"]*)"|([\w:.-]+)\s*=\s*'([^']*)'/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(source))) {
    const name = m[1] ?? m[3];
    const value = m[2] ?? m[4];
    attrs[name] = decodeXmlEntities(value);
  }
  return attrs;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Escapa un valor para usarlo como texto/atributo dentro de XML. */
export function escapeXml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Todos los elementos con ese nombre de tag, en cualquier nivel de profundidad. */
export function findAll(node: XmlElement, tag: string): XmlElement[] {
  const result: XmlElement[] = [];
  for (const child of node.children) {
    if (child.tag === tag) result.push(child);
    result.push(...findAll(child, tag));
  }
  return result;
}

/** Hijos directos con ese nombre de tag (no desciende más allá). */
export function findChildren(node: XmlElement, tag: string): XmlElement[] {
  return node.children.filter((child) => child.tag === tag);
}

/** Primer hijo directo con ese nombre de tag, si existe. */
export function findChild(node: XmlElement, tag: string): XmlElement | undefined {
  return node.children.find((child) => child.tag === tag);
}
