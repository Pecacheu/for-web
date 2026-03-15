import { Navigator } from "@solidjs/router";

const R_RelPath = /^\/i\/[^/]+/;

export default class Instance {
  readonly host?: string;
  readonly basePath: string;
  readonly isStoat: boolean;

  readonly apiUrl: string;
  readonly wsUrl: string;
  readonly mediaUrl: string;
  readonly proxyUrl: string;
  readonly gifboxUrl: string;

  readonly captchaKey: string;
  readonly maxEmoji: number;
  readonly enableVideo: boolean;

  // Not implemented, but should be fine for now
  // readonly maxReplies: number;
  // readonly maxAttachments: number;
  // readonly maxFileSize: number;
  // DEVELOPMENT_SESSION_ID
  // DEVELOPMENT_TOKEN
  // DEVELOPMENT_USER_ID

  constructor(
    apiUrl: string,
    wsUrl: string,
    mediaUrl: string,
    proxyUrl: string,
    gifboxUrl: string,
    captchaKey: string,
    maxEmoji: number,
    enableVideo: boolean,
    host?: string,
  ) {
    this.apiUrl = apiUrl;
    this.wsUrl = wsUrl;
    this.mediaUrl = mediaUrl;
    this.proxyUrl = proxyUrl;
    this.gifboxUrl = gifboxUrl;
    this.captchaKey = captchaKey;
    this.maxEmoji = maxEmoji;
    this.enableVideo = enableVideo;

    this.host = host;
    this.basePath = host ? `/i/${host}` : "";
    this.isStoat = [
      // historically...
      "https://api.revolt.chat",
      "https://beta.revolt.chat/api",
      "https://revolt.chat/api",
      // ... and now:
      "https://stoat.chat/api",
    ].includes(apiUrl);
  }

  /** Prepend a relative path with instance base URL
   * @param base Defaults to the base path of this instance
   */
  href = (path: string, base?: string) =>
    (base ? `/i/${base}` : this.basePath) + path;

  /** Convert an instance-specific path back to relative form */
  static relPath = (path: string) => path.replace(R_RelPath, "");

  /** Switch to a new instance and redirect the client */
  switchTo(url: URL, nav: Navigator) {
    nav(this.href(Instance.relPath(location.pathname), url.host));
  }
}
