import { ProjectType, VsCodeBridgeMessage } from "../infrastructure";

/**
 * A single file to be written to the workspace.
 *
 * `content` is always a string for transport, but its encoding depends on
 * `fileType`:
 *   - `"map" | "c-header" | "asm"`: UTF-8 text.
 *   - `"png"` or `"binary"`: base64-encoded raw bytes.
 */
export interface FileEntry {
  /** File content type. */
  fileType: "map" | "c-header" | "asm" | "png" | "binary";
  /** Workspace-relative path (forward-slash separated). */
  fileName: string;
  /**
   * File content. UTF-8 text for `map` / `c-header` / `asm`;
   * base64-encoded raw bytes for `png` / `binary`.
   */
  content: string;
}

/**
 * Message sent from the webview to the extension with all files ready to write.
 * Further entries are generated source files (tiles/sprites) that will be
 * appended in future iterations.
 */
export interface WriteFilesMessage extends VsCodeBridgeMessage {
  messageType: "writeFiles";

  /** All generated source files to write. */
  codeFiles: FileEntry[];
}

/**
 * Message sent from the webview to the extension when a .map file is ready
 * to be saved to the workspace. The extension decides the final destination.
 */
export interface SaveMapMessage extends VsCodeBridgeMessage {
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
export interface InitMessage extends VsCodeBridgeMessage {
  messageType: "init";

  /**
   * VS Code project type from .zxide.json.
   * If absent the webview is running outside VS Code and the user can
   * choose the target language freely.
   */
  projectType?: ProjectType;
}
