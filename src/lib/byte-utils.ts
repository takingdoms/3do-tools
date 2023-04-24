type IntegerType = 'U8' | 'I8' | 'U16' | 'I16' | 'U32' | 'I32';
type Endianness = 'LE' | 'BE';

type ExtraType = { 'CHAR': number };

const INTEGER_TYPES: IntegerType[] = ['U8', 'I8', 'U16', 'I16', 'U32', 'I32'];
const ENDIANNESSES: Endianness[] = ['LE', 'BE'];

type StructDef<TKeyName extends string = string> = ReadonlyArray<
  readonly [TKeyName, IntegerType]
>;

type StructDefWithExtra<TKeyName extends string = string> = ReadonlyArray<
readonly [TKeyName, IntegerType | ExtraType]
>;

function readStruct<TKeyName extends string = string>(
  data: DataView,
  offset: number,
  structDef: StructDef<TKeyName>,
  endianness?: Endianness,
): Readonly<Record<TKeyName, number>>;

function readStruct<TKeyName extends string = string>(
  data: DataView,
  offset: number,
  structDef: StructDefWithExtra<TKeyName>,
  endianness?: Endianness,
): Readonly<Record<TKeyName, number | DataView>>;

function readStruct<TKeyName extends string = string>(
  data: DataView,
  offset: number,
  structDef: StructDef<TKeyName> | StructDefWithExtra<TKeyName>,
  endianness: Endianness = 'LE',
): Readonly<Record<TKeyName, number>> | Readonly<Record<TKeyName, number | DataView>> {
  const result: Record<string, number | DataView> = {};

  for (const [name, type] of structDef) {
    if (typeof type === 'object') {
      const length = type['CHAR'];
      const buffer = data.buffer.slice(offset, offset + length);
      result[name] = new DataView(buffer);
      continue;
    }

    result[name] = readInteger(data, offset, type, endianness);

    if (type === 'U8' || type === 'I8') {
      offset += 1;
    }
    else if (type === 'U16' || type === 'I16') {
      offset += 2;
    }
    else if (type === 'U32' || type === 'I32') {
      offset += 4;
    }
  }

  return result as Readonly<typeof result>;
}

function calcStructSize(structDef: StructDef | StructDefWithExtra): number {
  let result = 0;

  for (const [_, type] of structDef) {
    if (typeof type === 'object') {
      result += type['CHAR'];
      continue;
    }

    if (type === 'U8' || type === 'I8') {
      result += 1;
    }
    else if (type === 'U16' || type === 'I16') {
      result += 2;
    }
    else if (type === 'U32' || type === 'I32') {
      result += 4;
    }
  }

  return result;
}

function writeStruct<TKeyName extends string = string>(
  payload: Readonly<Record<TKeyName, number>>/* | Readonly<Record<TKeyName, number | DataView>>*/,
  dest: DataView,
  destOffset: number,
  structDef: StructDef<TKeyName> | StructDefWithExtra<TKeyName>,
  endianness: Endianness = 'LE',
): void {
  for (const [name, type] of structDef) {
    if (typeof type === 'object') {
      // TODO
      throw 'Unsupported operation (for now)';
      continue;
    }

    writeInteger(payload[name], dest, destOffset, type, endianness);

    if (type === 'U8' || type === 'I8') {
      destOffset += 1;
    }
    else if (type === 'U16' || type === 'I16') {
      destOffset += 2;
    }
    else if (type === 'U32' || type === 'I32') {
      destOffset += 4;
    }
  }
}

function readInteger(
  data: DataView,
  pos: number,
  type: IntegerType,
  endianness: Endianness = 'LE',
): number {
  if (type === 'I8') {
    return data.getInt8(pos);
  }

  if (type === 'U8') {
    return data.getUint8(pos);
  }

  if (type === 'I16') {
    return data.getInt16(pos, endianness === 'LE');
  }

  if (type === 'U16') {
    return data.getUint16(pos, endianness === 'LE');
  }

  if (type === 'U32') {
    return data.getUint32(pos, endianness === 'LE');
  }

  // I32
  return data.getInt32(pos, endianness === 'LE');
}

function writeInteger(
  integer: number,
  data: DataView,
  pos: number,
  type: IntegerType,
  endianness: Endianness = 'LE',
): void {
  if (type === 'I8') {
    validateWrite(integer, type, -128, 127);
    data.setInt8(pos, integer);
  }
  else if (type === 'U8') {
    validateWrite(integer, type, 0, 255);
    data.setUint8(pos, integer);
  }
  else if (type === 'I16') {
    validateWrite(integer, type, -32768, 32767);
    data.setInt16(pos, integer, endianness === 'LE');
  }
  else if (type === 'U16') {
    validateWrite(integer, type, 0, 65535);
    data.setUint16(pos, integer, endianness === 'LE');
  }
  else if (type === 'U32') {
    validateWrite(integer, type, 0, 4_294_967_295);
    data.setUint32(pos, integer, endianness === 'LE');
  }
  else { // I32
    validateWrite(integer, type, -2_147_483_648, 2_147_483_647);
    data.setInt32(pos, integer, endianness === 'LE');
  }
}

function validateWrite(integer: number, type: IntegerType, min: number, max: number) {
  if (integer < min || integer > max) {
    throw new Error(`Error! The integer "${integer}" doesn't fit into a "${type}", which should be`
      + ` in the range of ${min} ~ ${max} (inclusive).`);
  }
}

export const ByteUtils = {
  readStruct,
  writeStruct,
  calcStructSize,
};
