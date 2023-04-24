import { ByteUtils } from "../byte-utils";
import { PointerlessObject3do, PointerlessPrimitive3do, Vertex3do } from "../object-3do";
import { OBJECT_STRUCT, OBJECT_STRUCT_SIZE, ObjectStructData, PRIMITIVE_STRUCT, PRIMITIVE_STRUCT_SIZE, PrimitiveStructData, VERTEX_STRUCT, VERTEX_STRUCT_SIZE } from "../structs";
import { Unifusion } from "./unifusion";

export type BuildMode = 'normal' | 'unifusion';

interface BuildContext {
  mode: BuildMode;
  currentOffset: number;
  areas: BuildArea[];
  textureNameMap: Record<string, number>; // key: textureName; value: offset;
}

interface BuildArea {
  offset: number;
  buffer: ArrayBuffer;
  name: string;
}

function build(rootObject3do: PointerlessObject3do, buildMode: BuildMode): ArrayBuffer {
  const ctx: BuildContext = {
    mode: buildMode,
    currentOffset: 0,
    areas: [],
    textureNameMap: {},
  };

  if (buildMode === 'unifusion') {
    rootObject3do = Unifusion.unifuseObjects(rootObject3do);
  }

  writeRootObject(rootObject3do, ctx);

  if (ctx.areas.length === 0) {
    throw new Error('Empty 3do');
  }

  ctx.areas.sort((a1, a2) => a1.offset - a2.offset);

  let lastEnd = 0;
  for (const area of ctx.areas) {
    const start = area.offset;

    if (start !== lastEnd) {
      throw new Error(`${start} !== ${lastEnd}`);
    }

    const length = area.buffer.byteLength;
    const end = start + length;
    lastEnd = end;

    // console.log(`${start} .. ${end} (${length}) : ${area.name}`);
  }

  const lastArea = ctx.areas[ctx.areas.length - 1];
  const totalLength = lastArea.offset + lastArea.buffer.byteLength;
  const finalBuffer = new Uint8Array(new ArrayBuffer(totalLength));

  for (const area of ctx.areas) {
    finalBuffer.set(new Uint8Array(area.buffer), area.offset);
  }

  return finalBuffer.buffer;
}

function writeRootObject(object: PointerlessObject3do, ctx: BuildContext): void {
  ctx.currentOffset += OBJECT_STRUCT_SIZE;

  writeTextureMap(object, ctx);

  writeObject(object, ctx, 0, 0);
}

function writeTextureMap(object: PointerlessObject3do, ctx: BuildContext): void {
  for (const primitive of object.primitives) {
    const { textureName } = primitive;

    if (!textureName) { // empty name
      continue;
    }

    if (textureName in ctx.textureNameMap) { // already exists
      continue;
    }

    ctx.textureNameMap[textureName] = writeName(textureName, ctx);
  }

  for (const child of object.children) {
    writeTextureMap(child, ctx);
  }
}

function writeObject(
  object: PointerlessObject3do,
  ctx: BuildContext,
  overrideStructOffset: number, // overrides map.currentOffset for the offset of the buffer area
  siblingOffset: number,
): void {
  const verticesOffset = writeVertices(object.vertices, ctx);
  const primitivesOffset = writePrimitives(object.primitives, ctx);
  const nameOffset = writeName(object.name, ctx);

  const childrenOffset = ctx.currentOffset;
  ctx.currentOffset += OBJECT_STRUCT_SIZE * object.children.length;

  for (let i = 0; i < object.children.length; i++) {
    const nextChild = object.children[i];
    const nextChildOffsetOverride = childrenOffset + (i * OBJECT_STRUCT_SIZE);
    const childSiblingOffset = i < object.children.length - 1
      ? childrenOffset + ((i + 1) * OBJECT_STRUCT_SIZE)
      : 0; // 0 = no sibling left

    writeObject(nextChild, ctx, nextChildOffsetOverride, childSiblingOffset);
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

  ctx.areas.push({
    offset: overrideStructOffset,
    buffer: objectBuffer,
    name: 'object',
  });
}

function writeName(name: string, ctx: BuildContext): number {
  const offsetStart = ctx.currentOffset;

  const charCodes: number[] = [];

  for (let i = 0; i < name.length; i++) {
    const code = name.charCodeAt(i);

    if (code > 127) { // ascii only supports 0 ~ 127
      throw new Error(`String "${name}" contains an unsupported character code: "${code}" at pos: "${i}"`);
    }

    charCodes.push(code);
  }

  const buffer = new Int8Array(charCodes.length + 1); // null terminated

  buffer.set(charCodes, 0);
  buffer[buffer.length - 1] = 0;

  ctx.areas.push({
    buffer,
    offset: offsetStart,
    name: 'name',
  });

  ctx.currentOffset += buffer.length;

  return offsetStart;
}

function writeVertices(vertices: Vertex3do[], ctx: BuildContext): number {
  const offsetStart = ctx.currentOffset;
  const buffer = new ArrayBuffer(VERTEX_STRUCT_SIZE * vertices.length);
  const view = new DataView(buffer);

  for (let i = 0; i < vertices.length; i++) {
    const nextVertex = vertices[i];
    const nextOffset = 0 + (i * VERTEX_STRUCT_SIZE);

    // console.log(nextVertex.source);
    ByteUtils.writeStruct(nextVertex.source, view, nextOffset, VERTEX_STRUCT);
  }

  ctx.areas.push({
    buffer,
    offset: offsetStart,
    name: 'vertices',
  });

  ctx.currentOffset += buffer.byteLength;

  return offsetStart;
}

function writePrimitives(primitives: PointerlessPrimitive3do[], ctx: BuildContext): number {
  const primitivesOffset = ctx.currentOffset;
  let vIndicesBufferSize = 0;

  for (let i = 0; i < primitives.length; i++) {
    const nextPrimitive = primitives[i];
    vIndicesBufferSize += nextPrimitive.vertexIndices.length * 2; // * 2 because each vertex is a u16

    // empty space here reserved for when the primitives are actually written
    ctx.currentOffset += PRIMITIVE_STRUCT_SIZE;
  }

  const vIndicesOffset = ctx.currentOffset;
  const vIndicesBuffer = new ArrayBuffer(vIndicesBufferSize);
  const vIndicesView = new DataView(vIndicesBuffer);

  const vIndicesSubOffsets: number[] = [];
  let vIndicesCursor = 0; // cursor into the vIndicesView

  for (let i = 0; i < primitives.length; i++) {
    const nextPrimitive = primitives[i];

    vIndicesSubOffsets.push(ctx.currentOffset);

    for (const vIndex of nextPrimitive.vertexIndices) {
      vIndicesView.setInt16(vIndicesCursor, vIndex, true);
      vIndicesCursor += 2; // 2 because Int16 = 2 bytes
    }

    ctx.currentOffset += nextPrimitive.vertexIndices.length * 2; // * 2 because each vertex is a u16
  }

  ctx.areas.push({
    buffer: vIndicesBuffer,
    offset: vIndicesOffset,
    name: 'vIndices',
  });

  const primitivesBuffer = new ArrayBuffer(PRIMITIVE_STRUCT_SIZE * primitives.length);
  const primitivesView = new DataView(primitivesBuffer);

  for (let i = 0; i < primitives.length; i++) {
    const nextPrimitive = primitives[i];
    const nextOffset = i * PRIMITIVE_STRUCT_SIZE;

    const textureNameOffset = nextPrimitive.textureName
      ? ctx.textureNameMap[nextPrimitive.textureName]
      : 0;

    if (textureNameOffset === undefined) {
      throw new Error(`Something went VERY wrong. Texture name not found: ${nextPrimitive.textureName}`);
    }

    const nextData: PrimitiveStructData = {
      ...nextPrimitive.source,
      OffsetToTextureName: textureNameOffset,
      OffsetToVertexIndexArray: vIndicesSubOffsets[i],
    };

    ByteUtils.writeStruct(nextData, primitivesView, nextOffset, PRIMITIVE_STRUCT);
  }

  ctx.areas.push({
    buffer: primitivesBuffer,
    offset: primitivesOffset,
    name: 'primitives',
  });

  return primitivesOffset;
}

export const Build3do = {
  build,
};
