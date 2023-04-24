import { DeepReadonly } from 'ts-essentials';
import { Object3do, Primitive3do, Vertex3do } from "../object-3do";

interface UnifusionContext {
  vertices: Vertex3do[];
  primitives: Primitive3do[];
}

type OffsetXYZ = [number, number, number];

function unifuseObjects(rootObject: DeepReadonly<Object3do>): Object3do {
  const ctx: UnifusionContext = {
    vertices: [],
    primitives: [],
  };

  // normally always [0, 0, 0] but just in case...
  const baseOffsets: OffsetXYZ = [
    rootObject.xOffset,
    rootObject.yOffset,
    rootObject.zOffset,
  ];

  appendObject(rootObject, ctx, baseOffsets);

  return {
    xOffset: rootObject.xOffset,
    yOffset: rootObject.yOffset,
    zOffset: rootObject.zOffset,
    name: rootObject.name,
    children: [],
    vertices: ctx.vertices,
    primitives: ctx.primitives,
    source: {
      ...rootObject.source,
      OffsetToChildObject: -1,
      OffsetToObjectName: -1,
      OffsetToPrimitiveArray: -1,
      OffsetToSiblingObject: -1,
      OffsetToVertexArray: -1,
      NumberOfVertexes: ctx.vertices.length,
      NumberOfPrimitives: ctx.primitives.length,
    },
  };
}

function appendObject(
  object3do: DeepReadonly<Object3do>,
  ctx: UnifusionContext,
  offsetsFromParent: OffsetXYZ,
): void {
  const vertexLocationMap: Record<number, number> = {}; // key = old index; value = new index

  for (let i = 0; i < object3do.vertices.length; i++) {
    const oldVertex = object3do.vertices[i];

    const newXYZ = {
      x: oldVertex.x + offsetsFromParent[0],
      y: oldVertex.y + offsetsFromParent[1],
      z: oldVertex.z + offsetsFromParent[2],
    };

    const newVertex: Vertex3do = {
      ...newXYZ,
      source: newXYZ, // because the struct data is identical to the actual Vertex3DO!
    };

    const existingIdx = ctx.vertices.findIndex((vertex) => {
      return vertex.x === newVertex.x
        && vertex.y === newVertex.y
        && vertex.z === newVertex.z;
    });

    if (existingIdx === -1) { // aka doesn't exist yet
      ctx.vertices.push(newVertex);
      vertexLocationMap[i] = ctx.vertices.length - 1;
    }
    else {
      vertexLocationMap[i] = existingIdx;
    }
  }

  for (const oldPrimitive of object3do.primitives) {
    const newVertexIndices = oldPrimitive.vertexIndices.map((oldVertexIndex) => {
      return vertexLocationMap[oldVertexIndex];
    });

    const newPrimitive: Primitive3do = {
      textureName: oldPrimitive.textureName,
      vertexIndices: newVertexIndices,
      source: {
        ...oldPrimitive.source,
        OffsetToTextureName: -1,
        OffsetToVertexIndexArray: -1,
      },
    };

    ctx.primitives.push(newPrimitive);
  }

  for (const child of object3do.children) {
    const offsets: OffsetXYZ = [
      offsetsFromParent[0] + child.xOffset,
      offsetsFromParent[1] + child.yOffset,
      offsetsFromParent[2] + child.zOffset,
    ];

    appendObject(child, ctx, offsets);
  }
}

export const Unifusion = {
  unifuseObjects,
};
