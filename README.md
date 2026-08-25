# Zx-Ide

```txt
███████╗██╗  ██╗     ██╗██████╗ ███████╗
╚══███╔╝╚██╗██╔╝     ██║██╔══██╗██╔════╝
  ███╔╝  ╚███╔╝█████╗██║██║  ██║█████╗  
 ███╔╝   ██╔██╗╚════╝██║██║  ██║██╔══╝  
███████╗██╔╝ ██╗     ██║██████╔╝███████╗
╚══════╝╚═╝  ╚═╝     ╚═╝╚═════╝ ╚══════╝
```

Extension for development on retro computers with vscode.

## Features

Currently the following types of projects are allowed:

### Zx Spectrum

- sjasmplus, pasmo (asm)
- z88dk (c/asm)

## Requirements

- VsCode [https://code.visualstudio.com/](https://code.visualstudio.com/)
- Installed visual studio code dev-container extension:
  [https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers](vscode-remote.remote-containers)

- Docker environment
  - Windows: [https://docs.docker.com/docker-for-windows/install/](https://docs.docker.com/docker-for-windows/install/)
  - Mac: [https://docs.docker.com/docker-for-mac/install/](https://docs.docker.com/docker-for-mac/install/)
  - Linux: [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)

## Install

You can install in one of these ways:

- **vscode**: Go to the vscode extensions and search for `zx-ide`.
- **marketplace**: Download it from the [marketplace](https://marketplace.visualstudio.com/items?itemName=dgzornoza.zxide).
- **github**: download latest .vsix from [GitHub Releases](https://github.com/dgzornoza/zx-ide/releases) file and install it.

## Usage

Refers to [Wiki](https://github.com/dgzornoza/zx-ide/wiki) for more information.

## Workspace (Extension + CLI + Web-client)

This repository is a multi-project workspace. There are three sub-projects:

- `projects/web-client` — Vue 3 + Vite frontend that runs inside the VS Code webviews.
- `projects/cli` — Node CLI used by the extension to scaffold new Z80 projects.
- `projects/vscode-extension` — The VS Code extension that ties everything together.

A multi-root workspace file is included so you can work with all three in a single VS Code window: [zx-ide.code-workspace](zx-ide.code-workspace). All three project folders plus `projects/shared` are part of it.

### Tasks

Each project is a standalone npm package with its own install/build/watch commands. Run them from the project directory or use the `--prefix` flag from the repo root.

#### Web client (`projects/web-client`)

- Install: `npm install --prefix ./projects/web-client`
- Build (one-shot): `npm run build --prefix ./projects/web-client`
- Watch: `npm run watch --prefix ./projects/web-client` — rebuilds `projects/web-client/dist/` on every save.
- Dev server: `npm run dev --prefix ./projects/web-client` — starts Vite's dev server with HMR; useful for browser-only work, not consumed by the extension.
- Type check: `npm run typecheck --prefix ./projects/web-client`
- Tests: `npm run test:watch --prefix ./projects/web-client` (Vitest)

#### CLI (`projects/cli`)

- Install: `npm install --prefix ./projects/cli`
- Build (production): `npm run build --prefix ./projects/cli`
- Watch: `npm run watch --prefix ./projects/cli` — rebuilds `projects/cli/dist/zx-ide-cli.js` on every save (dev webpack config, with source maps).
- Start (debug): `npm run start --prefix ./projects/cli` — webpack dev build + `node --inspect=9229 dist/zx-ide-cli.js` for debugging.
- Lint: `npm run lint --prefix ./projects/cli`

#### Extension (`projects/vscode-extension`)

- Install: `npm install --prefix ./projects/vscode-extension`
- Compile (one-shot): `npm run compile --prefix ./projects/vscode-extension`
- Watch: `npm run watch --prefix ./projects/vscode-extension` — runs `build-webview` + `build-cli` (both one-shot) and then `webpack --watch` on `src/`.
- Package (publish): `npm run package --prefix ./projects/vscode-extension` — production bundle for the marketplace.
- Test: `npm test --prefix ./projects/vscode-extension`

### How the three watches compose

The three `npm run watch` scripts are designed to run in parallel and stay isolated — each watches its own source tree and writes to its own `dist/`. The bridge between them is `CopyWebpackPlugin` in the extension's webpack config:

| Watch | Writes to | Extension picks it up via |
|---|---|---|
| `web-client` | `projects/web-client/dist/` | `CopyWebpackPlugin` pattern `{ from: '../web-client/dist', to: '../media' }` → copies into `projects/vscode-extension/media/` |
| `cli` | `projects/cli/dist/` | `CopyWebpackPlugin` pattern `{ from: '../cli/dist' }` → copies into `projects/vscode-extension/dist/` |
| `vscode-extension` | `projects/vscode-extension/dist/` (extension.js bundle) | direct webpack output |

In practice: open three terminals, one per project, run `npm run watch` in each. Edits to `web-client/src/` or `cli/src/` propagate to the extension bundle automatically, edits to `extension/src/` only rebuild the extension itself. Reload the webview inside VS Code (or run `Developer: Reload Window`) to see webview-only changes.

You don't have to run all three at once — only run the watch scripts for the projects you're actively editing. The extension's `npm run watch` does a one-shot build of `web-client` and `cli` at startup, so it works standalone too.

### Debug

- Run Extension: use the "Run Extension" launch configuration; it starts an Extension Host using the built `vscode-extension` output.
- Debug CLI: use the "Debug CLI" launch configuration; it builds `cli` and runs `dist/zx-ide-cli.js` with source maps.

#### Debugging a project that uses a devcontainer

If the target project you are debugging uses its own devcontainer, you must run this `zx-ide` repository inside a devcontainer too. The VS Code extension runs in a Node version tied to your VS Code, and the extension's webview code, CLI bundle, and terminal commands all need to talk to the target project's filesystem through a consistent path and event surface. Running one side on the host and the other inside a container produces path mismatches, broken installs, and filesystem watchers that never fire.

In practice:

1. Open `zx-ide` in its own devcontainer (this repo already includes `.devcontainer/`).
2. Add a `mounts` entry to `.devcontainer/devcontainer.json` pointing at the target project directory on the host. Each entry uses the Docker bind syntax with `source` (host), `target` (inside the container) and `type=bind`:

   ```json
   {
     "name": "zx-ide extension",
     "image": "dgzornoza/zxide-dev:latest",
     "containerUser": "vscode",
     "runArgs": [
       "--name=${localWorkspaceFolderBasename}"
     ],
     "mounts": [
       "source=<HOST_PATH_TO_TARGET_PROJECT>,target=/workspaces/debug-app,type=bind"
     ]
   }
   ```

   The example above mounts the target project from the host (replace `<HOST_PATH_TO_TARGET_PROJECT>` with an absolute path like `D:\\path\\to\\your\\project`) into `/workspaces/debug-app` inside the devcontainer. The container path (`target`) is what you open from VS Code's "Run Extension" host window in step 3.

   **Important**: the devcontainer will fail to start if the `source` path does not exist on the host — Docker rejects bind mounts whose source directory is missing. Make sure the target project directory exists before reopening the devcontainer, or temporarily remove the `mounts` entry if you don't need it for a session.

3. In the Extension Host window that `Run Extension` opens, open the target project folder using the mounted path (e.g. `/workspaces/debug-app`). The extension then operates against the devcontainerized project — paths, terminals, and file watchers all line up.

For the same reason, when running from a Windows host, do **not** mount the devcontainerized project with a different drive letter than where `zx-ide` lives — keep the bind mount paths consistent so the extension can resolve both sides.

## Testing

Test suites are scoped per project. Run them from the project directory or use the `--prefix` flag from the repo root.

### Web client (Vitest)

- Run all tests: `npm test --prefix ./projects/web-client`
- Watch mode: `npm run test:watch --prefix ./projects/web-client`
- Type check: `npm run typecheck --prefix ./projects/web-client`

Test files live in `projects/web-client/src/**/*.spec.ts` and cover the bit-packing primitives, code-generator strategies, validation paths, and the architectural invariant between plain `.asm` and compressed `.bin` outputs.

### VS Code extension (Mocha)

- Run tests: `npm test --prefix ./projects/vscode-extension`

This boots a VS Code Extension Host and runs the extension's test suite.

## License

This project is licensed under the **GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)**. This means you can use, copy, modify, and distribute this code under the terms of the AGPL-3.0. For more details, see the [LICENSE](./LICENSE) file or visit the [GNU AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) page.

For information about third-party toolchains included in the development container, see the [NOTICE.md](./NOTICE.md) file.

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](./CONTRIBUTING.md) and [Contributor License Agreement (CLA)](./CLA.md) before submitting any contributions.

## Contact

Any questions or suggestions, please contact me at [dgzornoza@dgzornoza.com](mailto:dgzornoza@dgzornoza.com).
