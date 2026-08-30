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

  // ─── Webview → Extension ───────────────────────────────────────────────
  /** Webview asks the host to write generated source files into the workspace. */
  | "writeFilesFromWebview"
  /** Webview asks the host to save a `.map` / `.cfg` configuration file. */
  | "saveMapFromWebview"
  /** Webview asks the host for the bytes of one image under `<workspace>/assets/`. */
  | "readAssetRequestFromWebview";

export type ProjectType = "sjasmplus" | "z88dk";

export interface VsCodeBridgeMessage {
  messageType: VsCodeBridgeMessageType;
}
