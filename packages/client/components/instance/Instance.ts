export default class Instance {
  readonly apiUrl: string;
  readonly wsUrl: string;
  readonly mediaUrl: string;

  constructor(apiUrl: string, wsUrl: string, mediaUrl: string) {
    this.apiUrl = apiUrl;
    this.wsUrl = wsUrl;
    this.mediaUrl = mediaUrl;
  }
}
