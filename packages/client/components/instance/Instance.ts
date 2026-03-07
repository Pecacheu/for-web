import { CONFIGURATION } from "@revolt/common";

export type Instance = {
  apiUrl: string;
  wsUrl: string;
  mediaUrl: string;
  proxyUrl: string;
  gifboxUrl: string;
  captchaKey: string;
  maxEmoji: number;
  enableVideo: boolean;
};

export const DefaultInstance: Instance = {
  apiUrl: CONFIGURATION.DEFAULT_API_URL,
  wsUrl: CONFIGURATION.DEFAULT_WS_URL,
  mediaUrl: CONFIGURATION.DEFAULT_MEDIA_URL,
  proxyUrl: CONFIGURATION.DEFAULT_PROXY_URL,
  gifboxUrl: CONFIGURATION.DEFAULT_GIFBOX_URL,
  captchaKey: CONFIGURATION.HCAPTCHA_SITEKEY,
  maxEmoji: CONFIGURATION.MAX_EMOJI,
  enableVideo: CONFIGURATION.ENABLE_VIDEO,
};

export class InstanceManager {
  //Endpoint URLs
  readonly apiUrl!: string;
  readonly wsUrl!: string;
  readonly mediaUrl!: string;
  readonly proxyUrl!: string;
  readonly gifboxUrl!: string;

  //Settings
  readonly captchaKey!: string;
  readonly maxEmoji!: number;
  readonly enableVideo!: boolean;

  //Derrived
  readonly isStoat!: boolean;

  constructor(inst: Instance) {
    this.set(inst);
  }

  set(inst: Instance) {
    // @ts-expect-error readonly
    this.apiUrl = inst.apiUrl;
    // @ts-expect-error readonly
    this.wsUrl = inst.wsUrl;
    // @ts-expect-error readonly
    this.mediaUrl = inst.mediaUrl;
    // @ts-expect-error readonly
    this.proxyUrl = inst.proxyUrl;
    // @ts-expect-error readonly
    this.gifboxUrl = inst.gifboxUrl;
    // @ts-expect-error readonly
    this.captchaKey = inst.captchaKey;
    // @ts-expect-error readonly
    this.maxEmoji = inst.maxEmoji;
    // @ts-expect-error readonly
    this.enableVideo = inst.enableVideo;

    // @ts-expect-error readonly
    this.isStoat = [
      // historically...
      "https://api.revolt.chat",
      "https://beta.revolt.chat/api",
      "https://revolt.chat/api",
      // ... and now:
      "https://stoat.chat/api",
    ].includes(this.apiUrl);
  }

  get(): Instance {
    return {
      apiUrl: this.apiUrl,
      wsUrl: this.wsUrl,
      mediaUrl: this.mediaUrl,
      proxyUrl: this.proxyUrl,
      gifboxUrl: this.gifboxUrl,
      captchaKey: this.captchaKey,
      maxEmoji: this.maxEmoji,
      enableVideo: this.enableVideo,
    };
  }
}
