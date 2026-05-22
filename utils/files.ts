export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const binary = atob(data);
  const array = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    array[i] = binary.charCodeAt(i);
  }

  return new File([array], filename, { type: mime });
}
