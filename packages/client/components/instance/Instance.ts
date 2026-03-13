import { NavigateOptions, Navigator, useNavigate } from "@solidjs/router";

let Nav: Navigator, NextHost: string;

export default class Instance {
  readonly isStoat: boolean;
  readonly apiUrl: string;
  readonly wsUrl: string;
  readonly mediaUrl: string;
  readonly proxyUrl: string;
  readonly gifboxUrl: string;
  readonly captchaKey: string;
  readonly maxEmoji: number;
  readonly enableVideo: boolean;
  readonly host: string | undefined;

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

    this.isStoat = [
      // historically...
      "https://api.revolt.chat",
      "https://beta.revolt.chat/api",
      "https://revolt.chat/api",
      // ... and now:
      "https://stoat.chat/api",
    ].includes(apiUrl);

    Nav = useNavigate();
  }

  /** Prepend a relative path with instance base URL */
  href(path: string) {
    return this.host ? `/i/${this.host}${path}` : path;
  }

  /** Navigate to a path while taking into account the current instance */
  navigate(to: string, opts?: Partial<NavigateOptions>) {
    Nav(this.host ? `/i/${this.host}${to}` : to, opts);
  }

  /** Set the new host that will be switched to on next navigate() call */
  setNext(host: string) {
    if (host.endsWith("/api")) host = host.slice(0, -4);
    //host = trimURL(host); //TODO Requires https://github.com/stoatchat/for-web/pull/835
    NextHost = host;
  }
}
