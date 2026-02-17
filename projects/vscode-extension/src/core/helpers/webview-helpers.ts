import * as vscode from 'vscode';
import { FileHelpers } from './file-helpers';

type WebviewHtmlOptions = {
  webview: vscode.Webview;
  extensionUri: vscode.Uri;
  htmlPageName: string;
  locale?: string;
};

export class WebviewHelpers {
  public static async buildWebviewHtml(options: WebviewHtmlOptions): Promise<string> {
    const { webview, extensionUri, htmlPageName, locale } = options;

    // path to the media folder within the html extension pages.
    const mediaFolder = vscode.Uri.joinPath(extensionUri, 'media');
    const mediaUriBase = webview.asWebviewUri(mediaFolder).toString().replace(/\/$/, '');

    const htmlPageUri = vscode.Uri.joinPath(mediaFolder, htmlPageName);
    const htmlPage = await FileHelpers.readFile(htmlPageUri);

    const nonce = WebviewHelpers.generateNonce();
    const cspMeta = WebviewHelpers.buildCspMeta(webview.cspSource, nonce);
    const bootstrap = WebviewHelpers.buildBootstrapScript(nonce, locale);

    let html = htmlPage
      .replace(/\{\{CSP_SOURCE\}\}/g, webview.cspSource)
      .replace(/\{\{NONCE\}\}/g, nonce)
      .replace(/(src|href)="\.?\/?assets\//g, `$1="${mediaUriBase}/assets/`);

    html = WebviewHelpers.ensureCspMeta(html, cspMeta);
    html = WebviewHelpers.ensureScriptNonces(html, nonce);
    html = WebviewHelpers.injectBootstrap(html, bootstrap);

    return html;
  }

  /**
   * Generates a random nonce string for use in Content Security Policy.
   * @returns A random nonce string.
   */
  private static generateNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i += 1) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  /**
   * Builds a Content Security Policy meta tag string with the given source and nonce.
   * @param cspSource The source to allow for content (e.g., script, style, img). Typically this would be the webview's cspSource.
   * @param nonce The nonce value to use for script tags in the policy.
   * @returns A string containing the meta tag with the constructed Content Security Policy.
   */
  private static buildCspMeta(cspSource: string, nonce: string): string {
    const csp = `default-src 'none'; img-src ${cspSource} data:; style-src ${cspSource}; script-src ${cspSource} 'nonce-${nonce}'; font-src ${cspSource};`;
    return `<meta http-equiv="Content-Security-Policy" content="${csp}" />`;
  }

  /**
   * Builds a bootstrap script tag that assigns the locale to the window object for use in the webview.
   * @param nonce The nonce value to use for the script tag.
   * @param locale The locale string to assign to window.__WEBVIEW_LOCALE__. Optional.
   * @returns A string containing the script tag with the assignment, or an empty string if no locale is provided.
   */
  private static buildBootstrapScript(nonce: string, locale?: string): string {
    if (!locale) {
      return '';
    }
    return `<script nonce="${nonce}">window.__WEBVIEW_LOCALE__ = ${JSON.stringify(locale)};</script>`;
  }

  private static ensureCspMeta(html: string, cspMeta: string): string {
    if (/Content-Security-Policy/i.test(html)) {
      return html;
    }
    return html.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n    ${cspMeta}`);
  }

  private static ensureScriptNonces(html: string, nonce: string): string {
    return html.replace(/<script(?![^>]*\bnonce=)([^>]*)>/gi, `<script nonce="${nonce}"$1>`);
  }

  private static injectBootstrap(html: string, bootstrap: string): string {
    if (!bootstrap) {
      return html;
    }
    if (html.includes('{{WEBVIEW_BOOTSTRAP}}')) {
      return html.replace(/\{\{WEBVIEW_BOOTSTRAP\}\}/g, bootstrap);
    }
    return html.replace(/<body(\s[^>]*)?>/i, (match) => `${match}\n    ${bootstrap}`);
  }
}
