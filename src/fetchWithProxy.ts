import { AxiosHeaders, AxiosRequestConfig, AxiosResponse } from "axios";
import { SocksProxyAgent } from "socks-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import { fetchWithRetry } from "./fetchWithRetry";
import { Proxy, PROXY_PROTOCOL } from "./types";

export async function fetchWithProxy<T = any, D = any>(
  url: string,
  options?: AxiosRequestConfig<D>,
  proxies: Proxy[] = [],
  attempts: number = 3,
  delay: number = 1500,
  timeout: number = 30 * 1000,
): Promise<AxiosResponse<T> & { ok: boolean; error?: Error }> {
  if (!proxies.length) {
    return fetchWithRetry<T, D>(url, options, attempts, delay, timeout);
  }

  for (const proxy of proxies) {
    let response:
      | (AxiosResponse<T> & { ok: boolean; error?: Error })
      | undefined;

    if ([PROXY_PROTOCOL.http, PROXY_PROTOCOL.https].includes(proxy.protocol)) {
      const proxyUrl = `http://${proxy.username && proxy.password ? `${proxy.username}:${proxy.password}@` : ""}${proxy.host}:${proxy.port}`;

      response = await fetchWithRetry<T, D>(
        url,
        {
          ...options,
          httpAgent: new HttpProxyAgent(proxyUrl),
          httpsAgent: new HttpsProxyAgent(proxyUrl),
        },
        attempts,
        delay,
        timeout,
      );
    }

    if (
      [PROXY_PROTOCOL.socks4, PROXY_PROTOCOL.socks5].includes(proxy.protocol)
    ) {
      const proxyUrl = `${proxy.protocol}://${proxy.username && proxy.password ? `${proxy.username}:${proxy.password}@` : ""}${proxy.host}:${proxy.port}`;

      const agent = new SocksProxyAgent(proxyUrl);

      response = await fetchWithRetry<T, D>(
        url,
        { ...options, httpAgent: agent, httpsAgent: agent },
        attempts,
        delay,
        timeout,
      );
    }

    if (response?.ok) {
      return response;
    }
  }

  const message = `[FATAL] Failed to fetch ${url} after ${attempts} attempts and ${proxies.length} proxies.`;
  const headers = new AxiosHeaders();

  return {
    data: undefined as any,
    config: { ...options, headers },
    headers,
    status: 500,
    statusText: message,
    ok: false,
    error: new Error(message),
  };
}
