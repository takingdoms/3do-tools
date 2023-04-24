import { ByteUtils } from "./byte-utils";

export const OBJECT_STRUCT = [
  ['VersionSignature',        'I32'],
  ['NumberOfVertexes',        'I32'],
  ['NumberOfPrimitives',      'I32'],
  ['SelectionPrimitiveOffset','I32'],
  ['XFromParent',             'I32'],
  ['YFromParent',             'I32'],
  ['ZFromParent',             'I32'],
  ['OffsetToObjectName',      'I32'],
  ['Always_0',                'I32'],
  ['OffsetToVertexArray',     'I32'],
  ['OffsetToPrimitiveArray',  'I32'],
  ['OffsetToSiblingObject',   'I32'],
  ['OffsetToChildObject',     'I32'],
] as const;

export const OBJECT_STRUCT_SIZE = ByteUtils.calcStructSize(OBJECT_STRUCT);

export const VERTEX_STRUCT = [
  ['x', 'I32'],
  ['y', 'I32'],
  ['z', 'I32'],
] as const;

export const VERTEX_STRUCT_SIZE = ByteUtils.calcStructSize(VERTEX_STRUCT);

export const PRIMITIVE_STRUCT = [
  ['ColorIndex',                'I32'],
  ['NumberOfVertexIndexes',     'I32'],
  ['Always_0',                  'I32'],
  ['OffsetToVertexIndexArray',  'I32'],
  ['OffsetToTextureName',       'I32'],
  ['Unknown_1',                 'I32'],
  ['Unknown_2',                 'I32'],
  ['IsColored',                 'I32'],
] as const;

export const PRIMITIVE_STRUCT_SIZE = ByteUtils.calcStructSize(PRIMITIVE_STRUCT);

// -------------------------------------------------------------------------------------------------

type StructData<T extends ReadonlyArray<readonly[string, string]>> =
  Record<((T)[number])[0], number>;

export type ObjectStructData = StructData<typeof OBJECT_STRUCT>;

export type VertexStructData = StructData<typeof VERTEX_STRUCT>;

export type PrimitiveStructData = StructData<typeof PRIMITIVE_STRUCT>;
