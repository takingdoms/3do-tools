import React from 'react';
import { NormalizedFileMap, normalizeFileMap } from '../lib/file-map';
import { MiniLib3do, ParseResult } from "../lib/mini-lib-3do";
import FileChooser from './FileChooser';
import FileMapView from "./FileMapView/FileMapView";
import Tools from "./Tools/Tools";

type Result = ParseResult & {
  normFileMap: NormalizedFileMap;
};

function App() {
  const [result, setResult] = React.useState<Result>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState();

  const onChooseFile = React.useCallback((file: File) => {
    setIsLoading(true);

    MiniLib3do.parseFileMap(file)
      .then((parseResult) => {
        setResult({
          ...parseResult,
          normFileMap: normalizeFileMap(parseResult.fileMap),
        });
      })
      .catch((err) => {
        console.error(err);
        setError(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (error) {
    return (
      <div className="w-screen h-screen flex justify-center items-center text-3xl text-red-500">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex justify-center items-center text-3xl">Loading...</div>
    );
  }

  if (result === undefined) {
    return <FileChooser onChoose={onChooseFile} />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="text-center text-2xl mb-2">
        {result.fileMap.file.name} ({result.fileMap.file.size} bytes)
      </div>

      <div className="flex flex-col space-y-4 lg:flex-row lg:space-x-4 lg:space-y-0">
        <div className="lg:basis-1/2 bg-gray-800 p-4">
          <Tools parseResult={result} />
        </div>
        <div className="lg:basis-1/2 bg-gray-800 p-4">
          <FileMapView normFileMap={result.normFileMap} />
        </div>
      </div>
    </div>
  );
}

export default App;
