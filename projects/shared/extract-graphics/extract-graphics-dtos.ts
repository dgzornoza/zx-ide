import { ProjectType, VsCodeBridgeMessage } from "../infrastructure";

/** One image under `<workspace>/assets/`. */
export interface AssetsEntry {
  /** Workspace-relative forward-slash path, e.g. "characters/player.png". */
  path: string;
  /**
   * `true` when `<dirname(path)>/<basename(path)>.cfg` exists on disk at the
   * time of the scan. Cheaply computed during the same walk as the listing.
   */
  configurationExists: boolean;
}

/** Extension → webview. Posted exactly once on panel open for tiles/sprites. */
export interface AssetsListMessage extends VsCodeBridgeMessage {
  messageType: "assetsListFromExtension";
  assets: AssetsEntry[];
  /** True when `<workspace>/assets/` does not exist; `assets` is then empty. */
  missing?: boolean;
}

/** Webview → extension. Asks the host for the bytes of one image. */
export interface ReadAssetRequestMessage extends VsCodeBridgeMessage {
  messageType: "readAssetRequestFromWebview";
  /** Workspace-relative path of an entry from a prior AssetsListMessage. */
  path: string;
  /**
   * Caller-generated opaque id. The matching response carries the same id so
   * concurrent or stale requests can be discarded safely.
   */
  requestId: string;
}

/** Extension → webview. Carries the bytes (base64) or an error string. */
export interface ReadAssetResponseMessage extends VsCodeBridgeMessage {
  messageType: "readAssetResponseFromExtension";
  /** Echoed back from the matching request. */
  path: string;
  requestId: string;
  /** Base64-encoded raw bytes; absent when `error` is set. */
  contentBase64?: string;
  /** Human-readable failure reason; present iff the read failed. */
  error?: string;
}

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
  messageType: 'writeFilesFromWebview';

  /** All generated source files to write. */
  codeFiles: FileEntry[];
}

/**
 * Message sent from the webview to the extension when a .map file is ready
 * to be saved to the workspace. The extension decides the final destination.
 */
export interface SaveMapMessage extends VsCodeBridgeMessage {
  messageType: 'saveMapFromWebview';
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
  messageType: 'initFromExtension';

  /**
   * VS Code project type from .zxide.json.
   * If absent the webview is running outside VS Code and the user can
   * choose the target language freely.
   */
  projectType?: ProjectType;
}
