import { StructuredDiagramInput } from '../projects/projects.service';
import { findAll, findChild, findChildren, parseXml, XmlElement } from './xml.util';

/**
 * RF13: interpreta un documento XMI 2.1 (perfil UML2 — el que produce
 * xmi-builder.util.ts y también Enterprise Architect al exportar) y lo
 * reduce al mismo subconjunto que soporta el resto de la plataforma:
 * clases con atributos/métodos y relaciones (asociación o herencia) por
 * NOMBRE de clase, listo para ProjectsService.importStructuredModel.
 *
 * No resuelve tipos de datos declarados en un paquete de tipos propio del
 * modelador (solo el patrón href "...#Tipo" que usa el exportador de esta
 * plataforma) ni conserva paquetes/estereotipos/información de diagrama:
 * ese es el límite explícito de interoperabilidad de CONTEXT.md.
 */
export function parseXmi(xmlText: string): StructuredDiagramInput {
  const root = parseXml(xmlText);
  const packagedElements = findAll(root, 'packagedElement');

  const classElements = packagedElements.filter(
    (el) => el.attrs['xmi:type'] === 'uml:Class',
  );
  const associationElements = packagedElements.filter(
    (el) => el.attrs['xmi:type'] === 'uml:Association',
  );

  const idToName = new Map<string, string>();
  for (const cls of classElements) {
    const id = cls.attrs['xmi:id'];
    const name = cls.attrs['name']?.trim();
    if (id && name) idToName.set(id, name);
  }

  const classes: StructuredDiagramInput['classes'] = [];
  const inheritance: Array<{ sourceId: string; targetId: string }> = [];

  for (const cls of classElements) {
    const name = cls.attrs['name']?.trim();
    if (!name) continue;

    const attributes = findChildren(cls, 'ownedAttribute').map((attr) => ({
      name: attr.attrs['name']?.trim() || 'campo',
      type: extractTypeName(attr),
    }));

    const methods = findChildren(cls, 'ownedOperation').map((op) => {
      const params = findChildren(op, 'ownedParameter');
      const inParams = params.filter((p) => (p.attrs['direction'] ?? 'in') !== 'return');
      const returnParam = params.find((p) => p.attrs['direction'] === 'return');
      return {
        name: op.attrs['name']?.trim() || 'metodo',
        parameters: inParams
          .map((p) => `${p.attrs['name']?.trim() || 'param'}: ${extractTypeName(p)}`)
          .join(', '),
        returnType: returnParam ? extractTypeName(returnParam) : 'void',
      };
    });

    classes.push({ name, attributes, methods });

    const classId = cls.attrs['xmi:id'];
    if (classId) {
      for (const gen of findChildren(cls, 'generalization')) {
        const targetId = gen.attrs['general'];
        if (targetId) inheritance.push({ sourceId: classId, targetId });
      }
    }
  }

  const relationships: NonNullable<StructuredDiagramInput['relationships']> = [];

  for (const assoc of associationElements) {
    const ends = findChildren(assoc, 'ownedEnd');
    if (ends.length < 2) continue;
    const [endA, endB] = ends;
    const sourceName = idToName.get(endA.attrs['type'] ?? '');
    const targetName = idToName.get(endB.attrs['type'] ?? '');
    if (!sourceName || !targetName) continue;

    relationships.push({
      sourceClassName: sourceName,
      targetClassName: targetName,
      name: assoc.attrs['name']?.trim() || undefined,
      sourceCardinality: boundsToCardinality(endA),
      targetCardinality: boundsToCardinality(endB),
      type: 'ASSOCIATION',
    });
  }

  for (const { sourceId, targetId } of inheritance) {
    const sourceName = idToName.get(sourceId);
    const targetName = idToName.get(targetId);
    if (!sourceName || !targetName) continue;
    relationships.push({
      sourceClassName: sourceName,
      targetClassName: targetName,
      type: 'INHERITANCE',
    });
  }

  return { classes, relationships };
}

/** Nombre "amigable" del tipo de un ownedAttribute/ownedParameter. */
function extractTypeName(el: XmlElement): string {
  const typeChild = findChild(el, 'type');
  if (typeChild) {
    const href = typeChild.attrs['href'];
    if (href?.includes('#')) return href.split('#').pop() || 'String';
    const idref = typeChild.attrs['xmi:idref'];
    if (idref) return idref;
  }
  return el.attrs['type'] || 'String';
}

/** Multiplicidad de un ownedEnd -> "1" | "0..1" | "0..*" | etc. */
function boundsToCardinality(end: XmlElement): string {
  const lower = findChild(end, 'lowerValue')?.attrs['value'] ?? '1';
  const upper = findChild(end, 'upperValue')?.attrs['value'] ?? '1';
  return lower === upper ? lower : `${lower}..${upper}`;
}
