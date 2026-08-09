import type { FileEntry } from "externalShared/extract-graphics/extract-graphics-dtos";

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
 * Packages an array of named files into a ZIP archive and triggers a
 * browser download. Text file types are stored as UTF-8; `png` and
 * `binary` entries are decoded from their base64 `content` payload.
 *
 * @param files   - Array of {@link FileEntry} entries (one per output file).
 * @param zipName - Base name for the downloaded `.zip` file (without extension).
 */
export async function downloadFilesAsZip(
  files: FileEntry[],
  zipName: string,
): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const file of files) {
    const isBinary = file.fileType === "png" || file.fileType === "binary";
    zip.file(file.fileName, file.content, isBinary ? { base64: true } : undefined);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `${zipName}.zip`);
}
