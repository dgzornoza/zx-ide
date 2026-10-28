import * as fs from 'fs';
import * as path from 'path';

/**
 * Resolves once `filePath` exists, watching its folder for the creation.
 * Rejects when the watcher fails or when the file does not appear within
 * `timeoutMilliseconds`; the watcher is always closed.
 *
 * Depends only on the standard library so the extension test host can load it.
 */
export function waitForFileCreation(filePath: string, timeoutMilliseconds: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const fileName = path.basename(filePath);
    let isSettled = false;

    const settle = (error?: Error): void => {
      if (isSettled) {
        return;
      }
      isSettled = true;
      clearTimeout(timeout);
      watcher.close();
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    const watcher = fs.watch(path.dirname(filePath), (_eventType, changedFileName) => {
      if (changedFileName === fileName && fs.existsSync(filePath)) {
        settle();
      }
    });
    watcher.on('error', (error) => settle(error));

    const timeout = setTimeout(
      () => settle(new Error(`Timed out after ${timeoutMilliseconds} ms waiting for '${filePath}'`)),
      timeoutMilliseconds
    );

    // The file may have been created before the watcher started.
    if (fs.existsSync(filePath)) {
      settle();
    }
  });
}
