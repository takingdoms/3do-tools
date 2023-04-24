import React from 'react';
import { Build3do } from "../../lib/build-3do";
import { ParseResult } from "../../lib/mini-lib-3do";
import { Utils } from "../../lib/utils";

type ToolsProps = {
  parseResult: ParseResult;
};

const Tools: React.FC<ToolsProps> = ({ parseResult }) => {
  const exportOptimized = React.useCallback(() => {
    const buffer = Build3do.optimized(parseResult); // TODO handle / display error!
    Utils.saveFile(buffer, parseResult.fileMap.file.name, 'application/x-binary');
  }, []);

  return (
    <div>
      <h3 className="text-2xl mb-4">Tools</h3>

      <div>
        <button onClick={exportOptimized}>Re-build and export</button>
      </div>
    </div>
  );
};

export default React.memo(Tools);
