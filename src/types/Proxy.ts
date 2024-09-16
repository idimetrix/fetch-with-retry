export enum PROXY_PROTOCOL {
  http = "http",
  https = "https",
  socks4 = "socks4",
  socks5 = "socks5",
  unknown = "unknown",
}

export type Proxy = {
  host: string;
  port: number;
  protocol: PROXY_PROTOCOL;
  username?: string;
  password?: string;
};
