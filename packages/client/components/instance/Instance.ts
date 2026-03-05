export default class Instance {
  readonly apiUrl: string;
  readonly wsUrl: string;

  constructor(apiUrl: string, wsUrl: string) {
    this.apiUrl = apiUrl;
    this.wsUrl = wsUrl;
  }
}
