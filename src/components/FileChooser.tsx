import React from 'react';

type FileChooserProps = {
  onChoose: (file: File) => void;
};

const FileChooser: React.FC<FileChooserProps> = ({ onChoose }) => {
  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center">
      <div className="text-3xl mb-4">Select a .3do file:</div>
      <input
        className="border border-slate-400 p-4"
        type="file"
        onChange={(ev) => {
          const files = ev.target.files;

          if (files && files.length > 0) {
            onChoose(files[0]);
          }
        }}
      />
    </div>
  );
};

export default FileChooser;
