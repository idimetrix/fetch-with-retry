import axios, { AxiosHeaders, AxiosRequestConfig, AxiosResponse } from "axios";
import { wait } from "./wait";

export async function fetchWithRetry<T = any, D = any>(
  url: string,
  options?: AxiosRequestConfig<D>,
  attempts: number = 3,
  delay: number = 1500,
  timeout: number = 30 * 1000,
): Promise<AxiosResponse<T> & { ok: boolean; error?: Error }> {
  let retries = 0;

  while (retries < attempts) {
    try {
      if (options?.cancelToken) {
        const response = await axios(url, options);

        if (response.status >= 200 && response.status < 300)
          return { ...response, ok: true };
        else {
          if ([404].includes(response.status))
            return { ...response, ok: false };
          else
            throw new Error(
              `STATUS CODE = "${response.status}", STATUS TEXT = "${response.statusText}", DETAILS = "${response.headers["server"] || ""}"`,
            );
        }
      } else {
        const source = axios.CancelToken.source();

        const timer = setTimeout(() => source.cancel(), timeout);

        const response = await axios(url, {
          ...options,
          cancelToken: source.token,
        });

        clearTimeout(timer);

        if (response.status >= 200 && response.status < 300)
          return { ...response, ok: true };
        else {
          if ([404].includes(response.status))
            return { ...response, ok: false };
          else
            throw new Error(
              `STATUS CODE = "${response.status}", STATUS TEXT = "${response.statusText}", DETAILS = "${response.headers["server"] || ""}"`,
            );
        }
      }
    } catch (error: any) {
      const response = error.response;

      const messages: string[] = [
        response
          ? `STATUS CODE = "${response.status}", STATUS TEXT = "${response.statusText}", DETAILS = "${response.headers["server"] || ""}" ${error.message}`
          : error.message,
      ].filter(Boolean);

      console.log(
        `[ERROR]: Attempt ${retries + 1} failed:`,
        messages.join(","),
        url,
      );

      retries++;

      if (retries < attempts) {
        await wait(delay);
      }
    }
  }

  const message = `[FATAL] Failed to fetch ${url} after ${attempts} attempts.`;
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
