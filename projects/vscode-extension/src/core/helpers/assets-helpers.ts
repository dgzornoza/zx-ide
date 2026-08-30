import { WorkspaceHelpers } from '@core/helpers/workspace-helpers';
import * as path from 'path';
import * as vscode from 'vscode';
import { AssetsEntry } from '../../../../shared/extract-graphics/extract-graphics-dtos';
import { FileHelpers } from './file-helpers';

/** Result of scanning `<workspace>/assets/`. */
export interface ScanAssetsResult {
  assets: AssetsEntry[];
  /** True when the assets directory itself does not exist. */
  missing: boolean;
}

/** File extensions harvested from `<workspace>/assets/`. Matched case-insensitively. */
const ASSETS_FILE_EXTENSIONS = ['.png', '.zxp'];

/**
 * Helpers for reading images and configuration from `<workspace>/assets/`.
 */
export class AssetsHelpers {
  /**
   * Recursively walks `<workspace>/assets/` and returns every `*.png` and `*.zxp`
   * entry in depth-first lexicographic order. `configurationExists` is computed
   * inline during the walk — one directory listing per parent directory.
   */
  public static async scanAssetsDirectory(): Promise<ScanAssetsResult> {
    const assetsUri = await WorkspaceHelpers.getWorkspaceUri('assets');
    // Probe the assets/ directory directly so the helper can distinguish "missing" from "empty but exists".
    const exists = await FileHelpers.fileExists(assetsUri);
    if (!exists) {
      return { assets: [], missing: true };
    }

    // get all assets files recursively
    const matched = await FileHelpers.walkFiles(assetsUri, { filterExtensions: ASSETS_FILE_EXTENSIONS });

    // Cache sibling lookups per parent directory so each directory is read once.
    const siblingNamesCache = new Map<string, Promise<ReadonlySet<string>>>();
    const loadSiblingNames = (parentUri: vscode.Uri): Promise<ReadonlySet<string>> => {
      const key = parentUri.fsPath;
      const cached = siblingNamesCache.get(key);
      if (cached) {
        return cached;
      }

      const pending = (async () => {
        try {
          const entries = await FileHelpers.readDirectoryEntries(parentUri);
          return new Set(entries.filter(([, type]) => type === vscode.FileType.File).map(([entryName]) => entryName));
        } catch {
          return new Set<string>();
        }
      })();

      siblingNamesCache.set(key, pending);
      return pending;
    };

    // create assets entries
    const assets: AssetsEntry[] = [];
    for (const { uri, relativePath } of matched) {
      const slashIndex = relativePath.lastIndexOf('/');
      const basename = slashIndex >= 0 ? relativePath.slice(slashIndex + 1) : relativePath;
      const dotIndex = basename.lastIndexOf('.');
      const stem = dotIndex >= 0 ? basename.slice(0, dotIndex) : basename;
      const configurationName = `${stem}.cfg`;
      const parentUri = vscode.Uri.file(path.dirname(uri.fsPath));
      const siblingNames = await loadSiblingNames(parentUri);
      const configurationExists = siblingNames.has(configurationName);
      assets.push({ path: relativePath, configurationExists });
    }

    return { assets, missing: false };
  }
}
