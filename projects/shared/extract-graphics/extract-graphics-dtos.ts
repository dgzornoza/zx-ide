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
 * The first entry is always the .map.json; further entries are generated source
 * files (tiles/sprites) that will be appended in future iterations.
 */
export interface WriteFilesMessage {
  messageType: "writeFiles";
  /* The .map.json file to write, derived from the source PNG path. */
  mapFile: FileEntry;
  /* all generated source files to write. */
  codeFiles: FileEntry[];
}
