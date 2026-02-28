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
