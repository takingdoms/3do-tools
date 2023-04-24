import { ByteUtils } from "./byte-utils";
import { FileMap, FileMapArea } from "./file-map";
import { Object3do, Primitive3do, Vertex3do } from "./object-3do";
import { OBJECT_STRUCT, OBJECT_STRUCT_SIZE, PRIMITIVE_STRUCT, PRIMITIVE_STRUCT_SIZE, VERTEX_STRUCT, VERTEX_STRUCT_SIZE } from "./structs";

export type ParseResult = {
  rootObject3do: Object3do;
  fileMap: FileMap;
};

async function parseFileMap(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const areas: FileMapArea[] = [];

  const rootObjects = parseObjects(view, 0, areas);

  if (rootObjects.length === 0) {
    throw new Error('Empty 3do');
  }

  if (rootObjects.length > 1) {
    throw new Error('Unexpected 3do file! This 3do has more than one "root" object!!!');
  }

  return {
    rootObject3do: rootObjects[0],
    fileMap: { file, areas },
  };
}

function parseObjects(view: DataView, offset: number, areas: FileMapArea[]) {
  const result: Object3do[] = [];
  let nextObjectOffset = offset;

  do {
    const nextObjectStruct = ByteUtils.readStruct(view, nextObjectOffset, OBJECT_STRUCT)

    areas.push({
      identifier: 'object',
      offset: nextObjectOffset,
      length: OBJECT_STRUCT_SIZE,
      structData: nextObjectStruct,
    });

    const name = parseName(view, nextObjectStruct['OffsetToObjectName'], areas, 'object-name');

    const vertices = parseVertices(
      view,
      nextObjectStruct['OffsetToVertexArray'],
      nextObjectStruct['NumberOfVertexes'],
      areas,
    );

    const primitives = parsePrimitives(
      view,
      nextObjectStruct['OffsetToPrimitiveArray'],
      nextObjectStruct['NumberOfPrimitives'],
      areas,
    );

    const children = nextObjectStruct['OffsetToChildObject'] !== 0
      ? parseObjects(view, nextObjectStruct['OffsetToChildObject'], areas)
      : [];

    const object: Object3do = {
      source: nextObjectStruct,
      name,
      vertices,
      primitives,
      children,
      xOffset: nextObjectStruct['XFromParent'],
      yOffset: nextObjectStruct['YFromParent'],
      zOffset: nextObjectStruct['ZFromParent'],
    };

    result.push(object);

    nextObjectOffset = nextObjectStruct['OffsetToSiblingObject'];
  } while (nextObjectOffset !== 0);

  return result;
}

function parseVertices(view: DataView, offset: number, count: number, areas: FileMapArea[]) {
  const result: Vertex3do[] = [];

  for (let i = 0; i < count; i ++) {
    const nextOffset = offset + (i * VERTEX_STRUCT_SIZE);

    const struct = ByteUtils.readStruct(
      view,
      nextOffset,
      VERTEX_STRUCT,
    );

    result.push({
      source: struct,
      x: struct.x,
      y: struct.y,
      z: struct.z,
    });

    areas.push({
      identifier: 'vertexes',
      offset: nextOffset,
      length: VERTEX_STRUCT_SIZE,
      structData: struct,
    });
  }

  return result;
}

function parsePrimitives(view: DataView, offset: number, count: number, areas: FileMapArea[]) {
  const result: Primitive3do[] = [];

  for (let i = 0; i < count; i++) {
    const nextOffset = offset + (i * PRIMITIVE_STRUCT_SIZE);

    const primitiveStruct = ByteUtils.readStruct(view, nextOffset, PRIMITIVE_STRUCT); // TODO

    areas.push({
      identifier: 'primitive',
      offset: nextOffset,
      length: PRIMITIVE_STRUCT_SIZE,
      structData: primitiveStruct,
    });

    const textureName = parseName(view, primitiveStruct['OffsetToTextureName'], areas, 'texture-name');

    const vertexIndices: number[] = [];

    for (let v = 0; v < primitiveStruct['NumberOfVertexIndexes']; v++) {
      // v * 2 because each vertex index reads 2 bytes (aka Uint16)
      const nextVertexIndex = view.getUint16(primitiveStruct['OffsetToVertexIndexArray'] + (v * 2), true);
      vertexIndices.push(nextVertexIndex);
    }

    areas.push({
      identifier: 'vindices',
      offset: primitiveStruct['OffsetToVertexIndexArray'],
      length: primitiveStruct['NumberOfVertexIndexes'] * 2, // * 2 because uint16
      _indices: vertexIndices,
    });

    result.push({
      source: primitiveStruct,
      vertexIndices,
      textureName,
    });
  }

  return result;
}

const textDecoder = new TextDecoder('ascii');
const NAME_LIMIT = 255;
function parseName(
  view: DataView,
  offset: number,
  areas: FileMapArea[],
  identifier: 'texture-name' | 'object-name',
) {
  if (offset === 0) {
    return '';
  }

  let size = 0;

  for (let i = 0; i < NAME_LIMIT; i++) {
    size++;
    const nextByte = view.getUint8(offset + i);
    if (nextByte === 0)
      break;
  }

  const slice = new Uint8Array(view.buffer, offset, size - 1);
  const name = textDecoder.decode(slice);

  areas.push({
    identifier,
    offset: offset,
    length: size,
    _name: name,
  });

  return name;
}

export const MiniLib3do = {
  parseFileMap,
};
