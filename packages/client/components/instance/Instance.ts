export default class Instance {
  readonly apiUrl: string;
  readonly wsUrl: string;
  readonly mediaUrl: string;
  readonly proxyUrl: string;

  constructor(
    apiUrl: string,
    wsUrl: string,
    mediaUrl: string,
    proxyUrl: string,
  ) {
    this.apiUrl = apiUrl;
    this.wsUrl = wsUrl;
    this.mediaUrl = mediaUrl;
    this.proxyUrl = proxyUrl;
  }
}
