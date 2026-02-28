/**
 * A single file to be written to the workspace.
 */
export interface FileEntry {
  /** Workspace-relative path (forward-slash separated). */
  path: string;
  /** UTF-8 file content. */
  content: string;
}

/**
 * Message sent from the webview to the extension with all files ready to write.
 * Further entries are generated source files (tiles/sprites) that will be
 * appended in future iterations.
 */
export interface WriteFilesMessage {
  messageType: "writeFiles";
  /** All generated source files to write. */
  codeFiles: FileEntry[];
}

/**
 * Message sent from the webview to the extension when a .map file is ready
 * to be saved to the workspace. The extension decides the final destination.
 */
export interface SaveMapMessage {
  messageType: "saveMap";
  /** Suggested filename, e.g. "player.map" (no path). */
  fileName: string;
  /** JSON serialised TileMapFile content. */
  content: string;
}

/** Code generation target language. */
export type CodeGenerationType = "asm" | "c";

/**
 * Message sent from the extension to the webview during initialisation.
 * Carries the VS Code project type so the webview can pre-select and
 * lock the code-generation language selector.
 */
export interface InitMessage {
  messageType: "init";
  /**
   * VS Code project type from .zxide.json.
   * If absent the webview is running outside VS Code and the user can
   * choose the target language freely.
   */
  projectType?: "sjasmplus" | "z88dk";
}
