import React from 'react';
import { Build3do, BuildMode } from "../../lib/build/build-3do";
import { ParseResult } from "../../lib/mini-lib-3do";
import { Utils } from "../../lib/utils";

type ToolsProps = {
  parseResult: ParseResult;
};

const Tools: React.FC<ToolsProps> = ({ parseResult }) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const buildAndExport = React.useCallback(async (mode: BuildMode) => {
    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);

      const buffer = Build3do.build(parseResult.rootObject3do, mode);
      await Utils.saveFile(buffer, parseResult.fileMap.file.name, 'application/x-binary');
    } catch (err) {
      console.error(err);
      alert('An unexpected error ocurred! Check the web console (F12 > Console) for log info.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return (
    <div>
      <h3 className="text-2xl mb-4">Tools</h3>

      <div className="flex flex-col space-y-4">
        <_SubTool
          title="Re-build and export"
          onClick={() => buildAndExport('normal')}
        >
          Doesn't change anything in the 3do (except its representation in the internal structure).
          Useful to single out if the build/export process is working correctly.
        </_SubTool>

        <_SubTool
          title="Unifusion and export"
          onClick={() => buildAndExport('unifusion')}
        >
          Fuses all objects into the root object and exports the result.
        </_SubTool>
      </div>
    </div>
  );
};

function _SubTool({
  title,
  children,
  onClick,
}: {
  title: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div className="border border-slate-600 p-2">
      <div>
        <button
          className="whitespace-nowrap bg-slate-700 hover:bg-slate-600 border border-slate-600
            shadow rounded px-2 py-1 mb-2"
          onClick={onClick}
        >{title}</button>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}

export default React.memo(Tools);
