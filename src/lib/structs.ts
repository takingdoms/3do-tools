import { ByteUtils } from "./byte-utils";

export const OBJECT_STRUCT = [
  ['VersionSignature',        'U32'],
  ['NumberOfVertexes',        'U32'],
  ['NumberOfPrimitives',      'U32'],
  ['SelectionPrimitiveOffset','U32'],
  ['XFromParent',             'U32'],
  ['YFromParent',             'U32'],
  ['ZFromParent',             'U32'],
  ['OffsetToObjectName',      'U32'],
  ['Always_0',                'U32'],
  ['OffsetToVertexArray',     'U32'],
  ['OffsetToPrimitiveArray',  'U32'],
  ['OffsetToSiblingObject',   'U32'],
  ['OffsetToChildObject',     'U32'],
] as const;

export const OBJECT_STRUCT_SIZE = ByteUtils.calcStructSize(OBJECT_STRUCT);

export const VERTEX_STRUCT = [
  ['x', 'U32'],
  ['y', 'U32'],
  ['z', 'U32'],
] as const;

export const VERTEX_STRUCT_SIZE = ByteUtils.calcStructSize(VERTEX_STRUCT);

export const PRIMITIVE_STRUCT = [
  ['ColorIndex',                'U32'],
  ['NumberOfVertexIndexes',     'U32'],
  ['Always_0',                  'U32'],
  ['OffsetToVertexIndexArray',  'U32'],
  ['OffsetToTextureName',       'U32'],
  ['Unknown_1',                 'U32'],
  ['Unknown_2',                 'U32'],
  ['IsColored',                 'U32'],
] as const;

export const PRIMITIVE_STRUCT_SIZE = ByteUtils.calcStructSize(PRIMITIVE_STRUCT);

// -------------------------------------------------------------------------------------------------

type StructData<T extends ReadonlyArray<readonly[string, string]>> =
  Record<((T)[number])[0], number>;

export type ObjectStructData = StructData<typeof OBJECT_STRUCT>;

export type VertexStructData = StructData<typeof VERTEX_STRUCT>;

export type PrimitiveStructData = StructData<typeof PRIMITIVE_STRUCT>;
