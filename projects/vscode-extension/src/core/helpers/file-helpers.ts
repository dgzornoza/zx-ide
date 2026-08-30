import { Logger } from '@core/logger';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

/** Options accepted by {@link FileHelpers.walkFiles}. */
export interface WalkFilesOptions {
  /** Lower-cased file extensions to keep (e.g. `['.png', '.zxp']`). The leading dot is optional. */
  readonly filterExtensions?: readonly string[];
}

/** A single match produced by {@link FileHelpers.walkFiles}. */
export interface WalkedFile {
  /** Absolute URI of the matched file. */
  readonly uri: vscode.Uri;
  /** Forward-slash path relative to the root passed to {@link FileHelpers.walkFiles}. */
  readonly relativePath: string;
}

export class FileHelpers {
  public static getTempFolder(): string {
    const tempFolder = path.join(os.tmpdir(), 'zxide');
    fs.existsSync(tempFolder) || fs.mkdirSync(tempFolder);
    return FileHelpers.pathNormalized(tempFolder);
  }

  public static clearTempFolder(): void {
    const tempFolder = FileHelpers.getTempFolder();
    fs.rm(tempFolder, { recursive: true, force: true }, (err) => {
      if (err) throw err;
    });
  }

  /**
   * Lists the direct entries of a directory. Returns `[name, fileType]`
   * tuples in the order reported by the underlying file system (callers
   * should sort if a deterministic order is required).
   */
  public static async readDirectoryEntries(absolutePath: string | vscode.Uri): Promise<[string, vscode.FileType][]> {
    const fileUri = absolutePath instanceof vscode.Uri ? absolutePath : vscode.Uri.file(absolutePath);
    try {
      return await vscode.workspace.fs.readDirectory(fileUri);
    } catch (error) {
      Logger.error(`Error reading directory '${fileUri}': ${error}`);
      throw error;
    }
  }

  public static async fileExists(absolutePath: string | vscode.Uri): Promise<boolean> {
    const fileUri = absolutePath instanceof vscode.Uri ? absolutePath : vscode.Uri.file(absolutePath);
    try {
      await vscode.workspace.fs.stat(fileUri);
      return true;
    } catch (error) {
      return false;
    }
  }

  public static async readFileSplittedByNewLine(absolutePath: string | vscode.Uri): Promise<string[]> {
    const content = await this.readFile(absolutePath);
    return content.split(FileHelpers.getNewLineSeparator(content));
  }

  /**
   * Read a file as utf-8 string.
   * @param absolutePath absolute file path
   * @returns string in utf-8
   */
  public static async readFile(absolutePath: string | vscode.Uri): Promise<string> {
    const fileContent = await this.readFileBytes(absolutePath);
    return Buffer.from(fileContent).toString('utf-8');
  }

  /**
   * Reads a file as raw bytes.
   * @param absolutePath absolute file path
   * @returns Uint8Array containing the file bytes content
   **/
  public static async readFileBytes(absolutePath: string | vscode.Uri): Promise<Uint8Array> {
    const fileUri = absolutePath instanceof vscode.Uri ? absolutePath : vscode.Uri.file(absolutePath);
    try {
      return await vscode.workspace.fs.readFile(fileUri);
    } catch (error) {
      Logger.error(`Error reading file bytes '${fileUri}': ${error}`);
      throw error;
    }
  }

  /**
   * Writes a file with the given content.
   * @param content The content to write
   * @param absolutePath The path to the file
   * @param options Options for the write operation
   *  option 'binary === true' content` is decoded from base64 and written
   *  as raw bytes, else content is write in utf8
   */
  public static async writeFile(content: string, absolutePath: string | vscode.Uri, options: { binary?: boolean } = {}): Promise<void> {
    const fileUri = absolutePath instanceof vscode.Uri ? absolutePath : vscode.Uri.file(absolutePath);
    if (!fileUri) {
      return;
    }
    try {
      const bytes = options.binary ? Buffer.from(content, 'base64') : Buffer.from(content, 'utf8');
      await vscode.workspace.fs.writeFile(fileUri, bytes);
    } catch (error) {
      Logger.error(`Error writting file '${absolutePath}': ${error}`);
    }
  }

  /**
   * Recursively walks `rootUri` and returns matching files in depth-first
   * lexicographic order by their workspace-relative path. A missing root
   * directory is treated as an empty walk rather than an error, so callers
   * can probe optional folders (e.g. `<workspace>/assets/`) without
   * catching exceptions.
   *
   * Files are matched when their lower-cased extension appears in
   * `options.filterExtensions`. The leading dot is optional on each entry. When
   * no extensions are supplied every regular file is returned.
   */
  public static async walkFiles(rootUri: vscode.Uri, options: WalkFilesOptions = {}): Promise<WalkedFile[]> {
    const matches: WalkedFile[] = [];
    const extensionMatcher = FileHelpers.buildExtensionMatcher(options.filterExtensions);
    await FileHelpers.walkFilesInto(rootUri, '', extensionMatcher, matches);
    return matches;
  }

  public static getLineNumberOfRegex(textLines: string[], regex: RegExp): number {
    for (let i = 0; i < textLines.length; i++) {
      if (regex.test(textLines[i].trim())) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Split a workspace-relative path safely in segments.
   * Remove empty segments and discard '.' and '..'
   */
  public static splitRelativePath(input: string): string[] {
    // Normalise backslashes, drop leading separators, then split.
    const normalised = input.replace(/\\/g, '/').replace(/^\/+/, '');
    const segments = normalised.split('/').filter((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
    return segments;
  }

  private static pathNormalized(fpath: string): string {
    return fpath.replace(/\\/g, '/');
  }

  private static getNewLineSeparator(content: string): string {
    return content.includes('\r\n') ? '\r\n' : '\n';
  }

  private static async walkFilesInto(
    directoryUri: vscode.Uri,
    relativePrefix: string,
    extensionMatcher: ((entryName: string) => boolean) | undefined,
    matches: WalkedFile[]
  ): Promise<void> {
    let entries: [string, vscode.FileType][];
    try {
      entries = await FileHelpers.readDirectoryEntries(directoryUri);
    } catch (error) {
      if (FileHelpers.isFileNotFound(error)) {
        return;
      }
      throw error;
    }

    // Lex order so the final depth-first walk matches the workspace-relative path order.
    entries.sort((first, second) => first[0].localeCompare(second[0]));

    // Single pass in lex order: recurse into subdirectories and collect files
    // at the current level as they appear, so the final order matches the
    // workspace-relative path lex order.
    for (const [name, fileType] of entries) {
      if (fileType === vscode.FileType.Directory) {
        const childPrefix = relativePrefix ? `${relativePrefix}/${name}` : name;
        const childUri = vscode.Uri.joinPath(directoryUri, name);
        await FileHelpers.walkFilesInto(childUri, childPrefix, extensionMatcher, matches);
      } else if (fileType === vscode.FileType.File && (!extensionMatcher || extensionMatcher(name))) {
        matches.push({
          uri: vscode.Uri.joinPath(directoryUri, name),
          relativePath: relativePrefix ? `${relativePrefix}/${name}` : name,
        });
      }
    }
  }

  private static buildExtensionMatcher(extensions?: readonly string[]): ((entryName: string) => boolean) | undefined {
    if (!extensions || extensions.length === 0) {
      return undefined;
    }

    const normalised = extensions.map((extension) => {
      const lower = extension.toLowerCase();
      return lower.startsWith('.') ? lower : `.${lower}`;
    });

    return (entryName: string) => {
      const lower = entryName.toLowerCase();

      for (const extension of normalised) {
        if (lower.endsWith(extension)) {
          return true;
        }
      }

      return false;
    };
  }

  /**
   * Detects VS Code's `FileNotFound` error across API versions.
   */
  private static isFileNotFound(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const errorCode = (error as { code?: string }).code;
    return errorCode === 'FileNotFound' || errorCode === 'EntryNotFound';
  }
}
