import React from 'react';
import { FileMapArea } from "../../lib/file-map";

type FileMapAreaViewProps = {
  area: FileMapArea;
};

const FileMapAreaView: React.FC<FileMapAreaViewProps> = ({ area }) => {
  const [expanded, setExpanded] = React.useState(false);

  const { identifier, offset, length } = area;

  const colorCss
    = identifier === 'object'
      ? 'bg-sky-700 border-sky-500'
    : identifier === 'texture-name'
      ? 'bg-purple-700 border-purple-500'
    : identifier === 'object-name'
      ? 'bg-purple-700 border-purple-500'
    : identifier === 'vertexes'
      ? 'bg-yellow-700 border-yellow-500'
    : identifier === 'vindices'
      ? 'bg-rose-700 border-rose-500'
    : identifier === 'primitive'
      ? 'bg-teal-700 border-teal-500'
    : identifier === 'unknown-gap'
      ? 'bg-slate-500 border-slate-300'
    : 'bg-black border-gray-700';

    const data
      = identifier === 'object'
        ? area.structData
      : identifier === 'texture-name'
        ? area._name
      : identifier === 'object-name'
        ? area._name
      : identifier === 'vertexes'
        ? area.structData
      : identifier === 'vindices'
        ? area._indices
      : identifier === 'primitive'
        ? area.structData
      : identifier === 'unknown-gap'
        ? undefined
      : null;

  return (
    <div className={`${colorCss} border px-4 py-2 font-mono`}>
      <div className="font-medium mb-1.5">
        {identifier}
      </div>
      <div>
        <span>{offset}</span>&nbsp;
        <span>...</span>&nbsp;
        <span>{offset + length}</span>&nbsp;
        <span>({length} bytes)</span>

        {data !== undefined && (
          <div className="flex flex-col items-start">
            <button
              className="hover:underline mb-2"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? '[Hide data]' : '[Show data]'}
            </button>

            {expanded && (
              <div className="bg-gray-700 whitespace-pre-wrap px-2 py-1">
                {JSON.stringify(data, null, 2)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(FileMapAreaView);
