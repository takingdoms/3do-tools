import React from 'react';
import { NormalizedFileMap } from "../../lib/file-map";
import FileMapAreaGroupView from "./FileMapAreaGroupView";

type FileMapViewProps = {
  normFileMap: NormalizedFileMap;
};

const FileMapView: React.FC<FileMapViewProps> = ({ normFileMap }) => {
  return (
    <div>
      <h3 className="text-2xl mb-4">Structure</h3>

      <div className="flex flex-col space-y-4">
        {normFileMap.areaGroups.map((areaGroup, index) => {
          return <FileMapAreaGroupView key={index} group={areaGroup} />;
        })}
      </div>
    </div>
  );
};

export default React.memo(FileMapView);
