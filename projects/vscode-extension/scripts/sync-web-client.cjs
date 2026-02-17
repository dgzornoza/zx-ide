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

const copyFile = (sourceFile, targetFile) => {
  ensureDir(path.dirname(targetFile));
  fs.copyFileSync(sourceFile, targetFile);
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
