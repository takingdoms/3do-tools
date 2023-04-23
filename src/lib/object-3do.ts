import { ObjectStructData, PrimitiveStructData, VertexStructData } from "./structs";

export type Object3do = {
  source: ObjectStructData;
  name: string;
  xOffset: number;
  yOffset: number;
  zOffset: number;
  vertices: Vertex3do[];
  primitives: Primitive3do[];
  children: Object3do[];
};

export type Vertex3do = {
  source: VertexStructData;
  x: number;
  y: number;
  z: number;
};

export type Primitive3do = {
  source: PrimitiveStructData;
  textureName: string;
  vertexIndices: number[];
};
