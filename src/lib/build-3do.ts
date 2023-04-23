import { ByteUtils } from "./byte-utils";
import { ParseResult } from "./mini-lib-3do";
import { Primitive3do } from "./object-3do";
import { Object3do, Vertex3do } from "./object-3do";
import { OBJECT_STRUCT, OBJECT_STRUCT_SIZE, ObjectStructData, PRIMITIVE_STRUCT, PRIMITIVE_STRUCT_SIZE, PrimitiveStructData, VERTEX_STRUCT, VERTEX_STRUCT_SIZE } from "./structs";

interface BuildMap {
  currentOffset: number;
  areas: BuildMapArea[];
}

interface BuildMapArea {
  offset: number;
  buffer: ArrayBuffer;
  name: string;
}

function optimized(parseResult: ParseResult): ArrayBuffer {
  const { rootObject3do } = parseResult;

  const map: BuildMap = {
    currentOffset: 0,
    areas: [],
  };

  console.log('WRITING OPTIMIZED 3DO!');

  writeObject(rootObject3do, map, 0, 0);

  if (map.areas.length === 0) {
    throw new Error('Empty 3do');
  }

  map.areas.sort((a1, a2) => a1.offset - a2.offset);

  let lastEnd = 0;
  for (const area of map.areas) {
    const start = area.offset;

    if (start !== lastEnd) {
      throw new Error(`${start} !== ${lastEnd}`);
    }

    const length = area.buffer.byteLength;
    const end = start + length;
    lastEnd = end;

    console.log(`${start} .. ${end} (${length}) : ${area.name}`);
  }

  const lastArea = map.areas[map.areas.length - 1];
  const totalLength = lastArea.offset + lastArea.buffer.byteLength;
  const finalBuffer = new Uint8Array(new ArrayBuffer(totalLength));

  for (const area of map.areas) {
    finalBuffer.set(new Uint8Array(area.buffer), area.offset);
  }

  return finalBuffer.buffer;
}

function writeObject(
  object: Object3do,
  map: BuildMap,
  overrideStructOffset: number, // overrides map.currentOffset for the offset of the buffer area
  siblingOffset: number,
): number {
  const objectOffset = map.currentOffset; // if root, is the same as overrideStructOffset aka 0

  if (overrideStructOffset === 0) {
    // if root, make up for the space of the object struct.
    // if not root, this isn't needed because the parent already made up for this space down below:
    // `map.currentOffset += OBJECT_STRUCT_SIZE * object.children.length;`
    map.currentOffset += OBJECT_STRUCT_SIZE;
  }

  const nameOffset = writeName(object.name, map);
  const verticesOffset = writeVertices(object.vertices, map);
  const primitivesOffset = writePrimitives(object.primitives, map);

  const childrenOffset = map.currentOffset;
  map.currentOffset += OBJECT_STRUCT_SIZE * object.children.length;

  for (let i = 0; i < object.children.length; i++) {
    const nextChild = object.children[i];
    const nextChildOffsetOverride = childrenOffset + (i * OBJECT_STRUCT_SIZE);
    const childSiblingOffset = i < object.children.length - 1
      ? childrenOffset + ((i + 1) * OBJECT_STRUCT_SIZE)
      : 0; // 0 = no sibling left

    writeObject(nextChild, map, nextChildOffsetOverride, childSiblingOffset);
  }

  const objectBuffer = new ArrayBuffer(OBJECT_STRUCT_SIZE);
  const objectView = new DataView(objectBuffer);

  const objectData: ObjectStructData = {
    ...object.source,
    OffsetToObjectName: nameOffset,
    OffsetToVertexArray: verticesOffset,
    OffsetToPrimitiveArray: primitivesOffset,
    OffsetToChildObject: object.children.length === 0 ? 0 : childrenOffset,
    OffsetToSiblingObject: siblingOffset,
  };

  ByteUtils.writeStruct(objectData, objectView, 0, OBJECT_STRUCT);

  map.areas.push({
    offset: overrideStructOffset,
    buffer: objectBuffer,
    name: 'object',
  });

  return objectOffset;
}

function writeName(name: string, map: BuildMap): number {
  const offsetStart = map.currentOffset;
  const textEncoder = new TextEncoder();
  const buffer = textEncoder.encode(name);
  const actualBuffer = new Uint8Array(buffer.length + 1); // null terminated

  actualBuffer[actualBuffer.length - 1] = 0;
  actualBuffer.set(buffer, 0);

  map.areas.push({
    buffer: actualBuffer,
    offset: offsetStart,
    name: 'name',
  });

  map.currentOffset += actualBuffer.length;

  return offsetStart;
}

function writeVertices(vertices: Vertex3do[], map: BuildMap): number {
  const offsetStart = map.currentOffset;
  const buffer = new ArrayBuffer(VERTEX_STRUCT_SIZE * vertices.length);
  const view = new DataView(buffer);

  for (let i = 0; i < vertices.length; i++) {
    const nextVertex = vertices[i];
    const nextOffset = 0 + (i * VERTEX_STRUCT_SIZE);

    ByteUtils.writeStruct(nextVertex.source, view, nextOffset, VERTEX_STRUCT);
  }

  map.areas.push({
    buffer,
    offset: offsetStart,
    name: 'vertices',
  });

  map.currentOffset += buffer.byteLength;

  return offsetStart;
}

function writePrimitives(primitives: Primitive3do[], map: BuildMap): number {
  const primitivesOffset = map.currentOffset;
  let vIndicesBufferSize = 0;

  for (let i = 0; i < primitives.length; i++) {
    const nextPrimitive = primitives[i];
    vIndicesBufferSize += nextPrimitive.vertexIndices.length * 2; // * 2 because each vertex is a u16

    // empty space here reserved for when the primitives are actually written
    map.currentOffset += PRIMITIVE_STRUCT_SIZE;
  }

  const nameOffsets: number[] = [];

  for (let i = 0; i < primitives.length; i++) {
    const nextPrimitive = primitives[i];

    nameOffsets.push(map.currentOffset);
    writeName(nextPrimitive.textureName, map);
  }

  const vIndicesOffset = map.currentOffset;
  const vIndicesBuffer = new ArrayBuffer(vIndicesBufferSize);
  const vIndicesView = new DataView(vIndicesBuffer);

  const vIndicesSubOffsets: number[] = [];
  let vIndicesCursor = 0; // cursor into the vIndicesView

  for (let i = 0; i < primitives.length; i++) {
    const nextPrimitive = primitives[i];

    vIndicesSubOffsets.push(map.currentOffset);

    for (const vIndex of nextPrimitive.vertexIndices) {
      vIndicesView.setUint16(vIndicesCursor, vIndex, true);
      vIndicesCursor += 2; // 2 because uint16 = 2 bytes
    }

    map.currentOffset += nextPrimitive.vertexIndices.length * 2; // * 2 because each vertex is a u16
  }

  map.areas.push({
    buffer: vIndicesBuffer,
    offset: vIndicesOffset,
    name: 'vIndices',
  });

  const primitivesBuffer = new ArrayBuffer(PRIMITIVE_STRUCT_SIZE * primitives.length);
  const primitivesView = new DataView(primitivesBuffer);

  for (let i = 0; i < primitives.length; i++) {
    const nextPrimitive = primitives[i];
    const nextOffset = i * PRIMITIVE_STRUCT_SIZE;

    const nextData: PrimitiveStructData = {
      ...nextPrimitive.source,
      OffsetToTextureName: nameOffsets[i],
      OffsetToVertexIndexArray: vIndicesSubOffsets[i],
    };

    ByteUtils.writeStruct(nextData, primitivesView, nextOffset, PRIMITIVE_STRUCT);
  }

  map.areas.push({
    buffer: primitivesBuffer,
    offset: primitivesOffset,
    name: 'primitives',
  });

  return primitivesOffset;
}

export const Build3do = {
  optimized,
};
