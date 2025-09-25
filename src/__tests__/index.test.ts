import axios, { AxiosResponse } from "axios";
import { fetchWithRetry } from "../fetchWithRetry";
import { fetchWithProxy } from "../fetchWithProxy";
import { wait } from "../wait";
import { PROXY_PROTOCOL } from "../types";

// Mock axios
jest.mock("axios", () => ({
  __esModule: true,
  default: jest.fn(),
  AxiosHeaders: jest.fn().mockImplementation(() => ({})),
}));

const mockedAxios = jest.mocked(axios);

describe("fetchWithRetry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return successful response on first attempt", async () => {
    const mockResponse: AxiosResponse = {
      data: { success: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    };

    mockedAxios.mockResolvedValueOnce(mockResponse);

    const result = await fetchWithRetry("https://example.com/api");

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ success: true });
    expect(mockedAxios).toHaveBeenCalledTimes(1);
  });

  it("should handle 404 responses gracefully", async () => {
    const mockResponse: AxiosResponse = {
      data: null,
      status: 404,
      statusText: "Not Found",
      headers: {},
      config: {} as any,
    };

    mockedAxios.mockResolvedValueOnce(mockResponse);

    const result = await fetchWithRetry("https://example.com/api");

    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
  });

  it("should retry on failure and eventually succeed", async () => {
    const mockError = new Error("Network Error");
    const mockResponse: AxiosResponse = {
      data: { success: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    };

    mockedAxios
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockResponse);

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const resultPromise = fetchWithRetry(
      "https://example.com/api",
      undefined,
      3,
      100,
    );

    // Advance timers to handle wait delays
    await jest.runAllTimersAsync();

    const result = await resultPromise;

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ success: true });
    expect(mockedAxios).toHaveBeenCalledTimes(3);
    expect(consoleSpy).toHaveBeenCalledTimes(2);

    consoleSpy.mockRestore();
  }, 10000);

  it("should fail after exhausting all retry attempts", async () => {
    const mockError = new Error("Network Error");
    mockedAxios.mockRejectedValue(mockError);

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const resultPromise = fetchWithRetry(
      "https://example.com/api",
      undefined,
      2,
      100,
    );

    // Advance timers to handle wait delays
    await jest.runAllTimersAsync();

    const result = await resultPromise;

    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.error).toBeInstanceOf(Error);
    expect(mockedAxios).toHaveBeenCalledTimes(2);

    consoleSpy.mockRestore();
  }, 10000);

  it("should use provided AbortController signal", async () => {
    const mockResponse: AxiosResponse = {
      data: { success: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    };

    mockedAxios.mockResolvedValueOnce(mockResponse);

    const controller = new AbortController();
    const result = await fetchWithRetry("https://example.com/api", {
      signal: controller.signal,
    });

    expect(result.ok).toBe(true);
    expect(mockedAxios).toHaveBeenCalledWith("https://example.com/api", {
      signal: controller.signal,
    });
  });

  it("should handle timeout with AbortController", async () => {
    let timeoutCallback: () => void;
    jest.spyOn(global, "setTimeout").mockImplementation((callback: any) => {
      timeoutCallback = callback;
      return 123 as any;
    });

    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

    const mockResponse: AxiosResponse = {
      data: { success: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    };

    mockedAxios.mockResolvedValueOnce(mockResponse);

    const result = await fetchWithRetry(
      "https://example.com/api",
      undefined,
      1,
      1000,
      5000,
    );

    expect(result.ok).toBe(true);
    expect(clearTimeoutSpy).toHaveBeenCalledWith(123);
  });
});

describe("fetchWithProxy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should call fetchWithRetry when no proxies provided", async () => {
    const mockResponse: AxiosResponse = {
      data: { success: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    };

    mockedAxios.mockResolvedValueOnce(mockResponse);

    const result = await fetchWithProxy(
      "https://example.com/api",
      undefined,
      [],
    );

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ success: true });
  });

  it("should use HTTP proxy correctly", async () => {
    const mockResponse: AxiosResponse = {
      data: { success: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    };

    mockedAxios.mockResolvedValueOnce(mockResponse);

    const proxy = {
      host: "proxy.example.com",
      port: 8080,
      protocol: PROXY_PROTOCOL.http,
      username: "user",
      password: "pass",
    };

    const result = await fetchWithProxy("https://example.com/api", undefined, [
      proxy,
    ]);

    expect(result.ok).toBe(true);
    expect(mockedAxios).toHaveBeenCalled();
  });

  it("should try multiple proxies until one succeeds", async () => {
    const mockError = {
      response: {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
      },
    };
    const mockResponse: AxiosResponse = {
      data: { success: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    };

    // First proxy fails, second succeeds
    mockedAxios
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockResponse);

    const proxies = [
      { host: "proxy1.example.com", port: 8080, protocol: PROXY_PROTOCOL.http },
      { host: "proxy2.example.com", port: 8080, protocol: PROXY_PROTOCOL.http },
    ];

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const resultPromise = fetchWithProxy(
      "https://example.com/api",
      undefined,
      proxies,
      2,
    );

    // Advance timers to handle wait delays
    await jest.runAllTimersAsync();

    const result = await resultPromise;

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ success: true });

    consoleSpy.mockRestore();
  }, 10000);

  it("should fail when all proxies are exhausted", async () => {
    const mockError = {
      response: {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
      },
    };
    mockedAxios.mockRejectedValue(mockError);

    const proxies = [
      { host: "proxy1.example.com", port: 8080, protocol: PROXY_PROTOCOL.http },
      {
        host: "proxy2.example.com",
        port: 8080,
        protocol: PROXY_PROTOCOL.socks5,
      },
    ];

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const resultPromise = fetchWithProxy(
      "https://example.com/api",
      undefined,
      proxies,
      1,
    );

    // Advance timers to handle wait delays
    await jest.runAllTimersAsync();

    const result = await resultPromise;

    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.error).toBeInstanceOf(Error);

    consoleSpy.mockRestore();
  }, 10000);
});

describe("wait", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should wait for the specified delay", async () => {
    const delay = 1000;
    const waitPromise = wait(delay);

    // Advance timers
    jest.advanceTimersByTime(delay);

    await expect(waitPromise).resolves.toBeUndefined();
  });
});
