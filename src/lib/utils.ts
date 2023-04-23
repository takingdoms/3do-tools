function debugPrintStruct(struct: Record<string, number>) {
  for (const [field, value] of Object.entries(struct)) {
    const hex = '0x' + value.toString(16).toUpperCase().padStart(4, '0');
    console.log(`${field}: ${value} (${hex})`);
  }
  console.log();
}

function saveFile(plaintext: ArrayBuffer, fileName: string, fileType: string) {
  return new Promise<void>((resolve, reject) => {
    const dataView = new DataView(plaintext);
    const blob = new Blob([dataView], { type: fileType });

    if ('msSaveBlob' in navigator) {
      (navigator.msSaveBlob as any)(blob, fileName);
      return resolve();
    } else if (/iPhone|fxios/i.test(navigator.userAgent)) {
      // This method is much slower but createObjectURL
      // is buggy on iOS
      const reader = new FileReader();
      reader.addEventListener('loadend', () => {
        if (reader.error) {
          return reject(reader.error);
        }
        if (reader.result) {
          const a = document.createElement('a');
          // @ts-ignore
          a.href = reader.result;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
        }
        resolve();
      });
      reader.readAsDataURL(blob);
    } else {
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(downloadUrl);
      setTimeout(resolve, 100);
    }
  });
}

export const Utils = {
  debugPrintStruct,
  saveFile,
};
