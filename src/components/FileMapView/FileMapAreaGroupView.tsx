import React from 'react';
import { FileMapAreaGroup } from "../../lib/file-map";
import FileMapAreaView from "./FileMapAreaView";

type FileMapAreaGroupViewProps = {
  group: FileMapAreaGroup;
};

const FileMapAreaGroupView: React.FC<FileMapAreaGroupViewProps> = ({ group }) => {
  const [expanded, setExpanded] = React.useState(false);

  const { identifier, areas } = group;

  const firstArea = areas[0];
  const lastArea = areas[areas.length - 1];
  const start = firstArea.offset;
  const end = lastArea.offset + lastArea.length;

  const colorCss
    = identifier === 'object'
      ? 'bg-sky-800 border-sky-600'
    : identifier === 'texture-name'
      ? 'bg-purple-800 border-purple-600'
    : identifier === 'object-name'
      ? 'bg-purple-800 border-purple-600'
    : identifier === 'vertexes'
      ? 'bg-yellow-800 border-yellow-600'
    : identifier === 'primitive'
      ? 'bg-teal-800 border-teal-600'
    : identifier === 'unknown-gap'
      ? 'bg-slate-600 border-slate-400'
    : 'bg-black border-gray-700';

  return (
    <div className={`${colorCss} border px-4 py-2 font-mono`}>
      <div>
        {identifier}{' '}
        {identifier !== 'unknown-gap' && <span>x{areas.length}</span>}
      </div>
      <div>
        <span>{start}</span>&nbsp;
        <span>...</span>&nbsp;
        <span>{end}</span>&nbsp;
        <span>({end - start} bytes)</span>
      </div>
      {identifier !== 'unknown-gap' && (
        <div className="flex flex-col items-start">
          <button
            className="hover:underline mb-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '[Collapse]' : '[Expand]'}
          </button>

          <div className="inline-flex flex-col space-y-2">
            {expanded && areas.map((area, index) => {
              return <FileMapAreaView key={index} area={area} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(FileMapAreaGroupView);
