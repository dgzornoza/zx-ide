// Syncs web-client/dist into vscode-extension/media; --watch updates on file changes.
// If a file is removed from dist, the corresponding media file is deleted.
// If dist is missing, exits with an error.
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const watchMode = args.includes('--watch');

const extensionRoot = path.resolve(__dirname, '..');
const distRoot = path.resolve(extensionRoot, '..', 'web-client', 'dist');
const mediaRoot = path.resolve(extensionRoot, 'media');

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

// Brief blocking wait without importing timers in the hot path.
const sleep = (ms) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // intentional spin — the script is short-lived, sync I/O dominates.
  }
};

/**
 * Copies a file, retrying on transient Windows file locks (EPERM/EBUSY).
 *
 * When the VS Code extension is active, it holds handles on every file in
 * `media/`. In Windows + devcontainer setups those handles propagate to the
 * container filesystem and block `copyFileSync` from overwriting in place.
 * Unlinking the destination first usually releases the lock; if not, a small
 * backoff usually wins once VS Code finishes serving the file.
 */
const copyFile = (sourceFile, targetFile) => {
  ensureDir(path.dirname(targetFile));
  const maxAttempts = 4;
  let lastError = undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      if (fs.existsSync(targetFile)) {
        try {
          fs.unlinkSync(targetFile);
        } catch (unlinkError) {
          if (unlinkError.code !== 'EPERM' && unlinkError.code !== 'EBUSY') {
            throw unlinkError;
          }
          // Locked; fall through to the copy attempt below, which will
          // fail with the same error and trigger another retry.
        }
      }
      fs.copyFileSync(sourceFile, targetFile);
      return;
    } catch (error) {
      lastError = error;
      if ((error.code !== 'EPERM' && error.code !== 'EBUSY') || attempt === maxAttempts) {
        throw error;
      }
      sleep(150 * attempt);
    }
  }
  throw lastError;
};

const copyDir = (sourceDir, targetDir) => {
  if (!fs.existsSync(sourceDir)) {
    return;
  }
  ensureDir(targetDir);
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else if (entry.isFile()) {
      copyFile(sourcePath, targetPath);
    }
  }
};

const removeFile = (targetFile) => {
  if (fs.existsSync(targetFile)) {
    fs.unlinkSync(targetFile);
  }
};

const syncAll = () => {
  if (!fs.existsSync(distRoot)) {
    console.error('web-client dist not found:', distRoot);
    process.exitCode = 1;
    return;
  }
  copyDir(distRoot, mediaRoot);
  console.log('web-client synced to media');
};

const syncSingle = (relativePath) => {
  const sourcePath = path.join(distRoot, relativePath);
  const targetPath = path.join(mediaRoot, relativePath);
  if (fs.existsSync(sourcePath) && fs.statSync(sourcePath).isFile()) {
    copyFile(sourcePath, targetPath);
    return;
  }
  removeFile(targetPath);
};

const startWatch = () => {
  console.log('Watching web-client dist for changes...');
  fs.watch(distRoot, { recursive: true }, (_eventType, filename) => {
    if (!filename) {
      return;
    }
    const normalized = filename.replace(/\\/g, path.sep);
    syncSingle(normalized);
  });
};

syncAll();
if (watchMode) {
  startWatch();
}
