/**
 * Discriminator tag for messages crossing the extension ↔ webview bridge.
 *
 * Convention: every tag name carries an explicit `FromExtension` or
 * `FromWebview` suffix so the direction is obvious from the wire string
 * alone — no need to look up the message interface to know who sends it.
 */
export type VsCodeBridgeMessageType =
  // ─── Extension → Webview ───────────────────────────────────────────────
  /** Extension sends the VS Code project type on webview boot. */
  | "initFromExtension"
  /** Extension sends the workspace assets listing once per panel open. */
  | "assetsListFromExtension"
  /** Extension returns the bytes (or an error) requested via readAssetRequestFromWebview. */
  | "readAssetResponseFromExtension"
  /** Extension reports the outcome of a writeFilesFromWebview request. */
  | "writeFilesResultFromExtension"

  // ─── Webview → Extension ───────────────────────────────────────────────
  /** Webview is mounted and listening; the extension may send its initial messages. */
  | "readyFromWebview"
  /** Webview asks the host to write generated source files into the workspace. */
  | "writeFilesFromWebview"
  /** Webview asks the host for the bytes of one image under `<workspace>/assets/`. */
  | "readAssetRequestFromWebview";

export type ProjectType = "sjasmplus" | "z88dk";

export interface VsCodeBridgeMessage {
  messageType: VsCodeBridgeMessageType;
}
