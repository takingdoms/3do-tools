import { ObjectStructData, PrimitiveStructData, VertexStructData } from "./structs";

export interface FileMap {
  file: File;
  areas: FileMapArea[];
}

interface BaseFileMapArea<TIdentifier extends string> {
  identifier: TIdentifier;
  offset: number;
  length: number;
}

type BaseFileMapAreaWithStruct<TId extends string, TStruct> = BaseFileMapArea<TId> & {
  structData: TStruct;
};

export type ObjectArea = BaseFileMapAreaWithStruct<'object', ObjectStructData>;
export type VertexArea = BaseFileMapAreaWithStruct<'vertexes', VertexStructData>;
export type VindicesArea = BaseFileMapArea<'vindices'>;
export type PrimitiveArea = BaseFileMapAreaWithStruct<'primitive', PrimitiveStructData>;
export type NameArea = BaseFileMapArea<'object-name' | 'texture-name'>;
export type UnknownGapArea = BaseFileMapArea<'unknown-gap'>;

export type FileMapArea = ObjectArea | VertexArea | VindicesArea | PrimitiveArea | NameArea | UnknownGapArea;

//:: Normalized ------------------------------------------------------------------------------------

export interface NormalizedFileMap {
  source: FileMap;
  areaGroups: FileMapAreaGroup[];
}

export interface FileMapAreaGroup {
  identifier: string;
  areas: FileMapArea[];
}

//:: Utils -----------------------------------------------------------------------------------------

export function normalizeFileMap(fileMap: FileMap): NormalizedFileMap {
  const areaGroups: FileMapAreaGroup[] = [];

  const sortedAreas = [...fileMap.areas];
  sortedAreas.sort((a1, a2) => {
    return a1.offset - a2.offset;
  });

  for (let i = 0; i < sortedAreas.length; i++) {
    const currArea = sortedAreas[i];
    const lastAreaGroup = areaGroups.length > 0 ? areaGroups[areaGroups.length - 1] : undefined;

    if (lastAreaGroup !== undefined && lastAreaGroup.identifier === currArea.identifier) {
      lastAreaGroup.areas.push(currArea);

      continue;
    }

    areaGroups.push({
      identifier: currArea.identifier,
      areas: [ currArea ],
    });
  }

  const finalAreaGroups: typeof areaGroups = [];

  for (let i = 0; i < areaGroups.length; i++) {
    const currGroup = areaGroups[i];

    if (i > 0) {
      const prevGroup = areaGroups[i - 1];
      const prevGroupLastArea = prevGroup.areas[prevGroup.areas.length - 1];
      const prevGroupEnd = prevGroupLastArea.offset + prevGroupLastArea.length;
      const currGroupStart = currGroup.areas[0].offset;
      const gapSize = currGroupStart - prevGroupEnd;

      if (gapSize > 0) {
        // console.log(`${prevGroupEnd} ~ ${currGroupStart}`);
        finalAreaGroups.push({
          identifier: 'unknown-gap',
          areas: [
            {
              identifier: 'unknown-gap',
              offset: prevGroupEnd,
              length: currGroupStart - prevGroupEnd,
            },
          ],
        });
      }
    }

    finalAreaGroups.push(currGroup);
  }

  return {
    source: fileMap,
    areaGroups: finalAreaGroups,
  };
}
