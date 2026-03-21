/**
 * Triggers a browser download for the given {@link Blob}.
 *
 * Creates a temporary object URL, clicks a hidden anchor to start the
 * download, and immediately revokes the URL to free memory.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Packages an array of named text files into a ZIP archive and triggers a
 * browser download.
 *
 * @param files   - Array of `{ fileName, content }` objects to include in the ZIP.
 * @param zipName - Base name for the downloaded `.zip` file (without extension).
 */
export async function downloadFilesAsZip(
  files: { fileName: string; content: string }[],
  zipName: string,
): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.fileName, file.content);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `${zipName}.zip`);
}
