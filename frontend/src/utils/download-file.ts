/** Faz o navegador baixar o conteúdo como arquivo, sem sair da página. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Barras e outros caracteres de caminho não servem em nome de arquivo ("OS 010/BAFL/2026" → "OS 010-BAFL-2026"). */
export function toFilename(name: string) {
  return name.replace(/[\\/:*?"<>|]+/g, "-");
}
