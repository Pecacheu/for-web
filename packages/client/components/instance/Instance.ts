export default class Instance {
  readonly isStoat: boolean;
  readonly apiUrl: string;
  readonly wsUrl: string;
  readonly mediaUrl: string;
  readonly proxyUrl: string;
  readonly gifboxUrl: string;

  constructor(
    apiUrl: string,
    wsUrl: string,
    mediaUrl: string,
    proxyUrl: string,
    gifboxUrl: string,
  ) {
    this.isStoat = [
      // historically...
      "https://api.revolt.chat",
      "https://beta.revolt.chat/api",
      "https://revolt.chat/api",
      // ... and now:
      "https://stoat.chat/api",
    ].includes(apiUrl);
    this.apiUrl = apiUrl;
    this.wsUrl = wsUrl;
    this.mediaUrl = mediaUrl;
    this.proxyUrl = proxyUrl;
    this.gifboxUrl = gifboxUrl;
  }
}
