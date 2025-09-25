# fetch-with-retry3

[![npm version](https://badge.fury.io/js/fetch-with-retry3.svg)](https://badge.fury.io/js/fetch-with-retry3)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A robust, TypeScript-first HTTP client built on top of Axios with automatic retry logic and proxy support. Designed to handle unreliable network conditions with configurable retry strategies, timeouts, and comprehensive error handling.

## ✨ Features

- 🔄 **Automatic Retry Logic**: Configurable retry attempts with exponential backoff
- 🌐 **Proxy Support**: HTTP(S) and SOCKS4/5 proxy support with authentication
- ⚡ **Modern AbortController**: Uses AbortController instead of deprecated CancelToken
- 🛡️ **100% TypeScript**: Full type safety with comprehensive type definitions
- 🎯 **Zero Configuration**: Works out of the box with sensible defaults
- 📊 **Request/Response Logging**: Built-in error logging for debugging
- 🧪 **Thoroughly Tested**: Comprehensive test suite with 95%+ coverage

## 📦 Installation

```bash
npm install fetch-with-retry3
# or
yarn add fetch-with-retry3
# or
pnpm add fetch-with-retry3
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { fetchWithRetry } from 'fetch-with-retry3';

// Simple GET request
const response = await fetchWithRetry('https://api.example.com/users');

if (response.ok) {
  console.log('Success:', response.data);
} else {
  console.error('Error:', response.error);
}
```

### With Custom Configuration

```typescript
import { fetchWithRetry } from 'fetch-with-retry3';

const response = await fetchWithRetry(
  'https://api.example.com/data',
  {
    method: 'POST',
    data: { name: 'John Doe', email: 'john@example.com' },
    headers: { 'Content-Type': 'application/json' }
  },
  5,      // 5 retry attempts
  2000,   // 2 second delay between retries
  30000   // 30 second timeout
);
```

## 📖 API Reference

### fetchWithRetry

```typescript
function fetchWithRetry<T = any, D = any>(
  url: string,
  options?: AxiosRequestConfig<D>,
  attempts?: number,
  delay?: number,
  timeout?: number
): Promise<AxiosResponse<T> & { ok: boolean; error?: Error }>
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | `string` | - | The request URL |
| `options` | `AxiosRequestConfig<D>` | `{}` | Axios request configuration |
| `attempts` | `number` | `3` | Number of retry attempts |
| `delay` | `number` | `1500` | Delay between retries (ms) |
| `timeout` | `number` | `30000` | Request timeout (ms) |

#### Returns

Returns a Promise that resolves to an enhanced AxiosResponse with:
- `ok`: Boolean indicating if the request was successful (2xx status)
- `error`: Error object if the request failed after all retries

### fetchWithProxy

```typescript
function fetchWithProxy<T = any, D = any>(
  url: string,
  options?: AxiosRequestConfig<D>,
  proxies?: Proxy[],
  attempts?: number,
  delay?: number,
  timeout?: number
): Promise<AxiosResponse<T> & { ok: boolean; error?: Error }>
```

#### Proxy Configuration

```typescript
type Proxy = {
  host: string;
  port: number;
  protocol: PROXY_PROTOCOL;
  username?: string;
  password?: string;
};

enum PROXY_PROTOCOL {
  http = "http",
  https = "https",
  socks4 = "socks4",
  socks5 = "socks5"
}
```

## 📝 Examples

### GET Request

```typescript
import { fetchWithRetry } from 'fetch-with-retry3';

const getUserData = async (userId: string) => {
  const response = await fetchWithRetry(`https://api.example.com/users/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer your-token-here'
    }
  });

  if (response.ok) {
    return response.data;
  } else {
    throw new Error(`Failed to fetch user: ${response.error?.message}`);
  }
};
```

### POST Request with Retry

```typescript
import { fetchWithRetry } from 'fetch-with-retry3';

const createUser = async (userData: any) => {
  const response = await fetchWithRetry(
    'https://api.example.com/users',
    {
      method: 'POST',
      data: userData,
      headers: { 'Content-Type': 'application/json' }
    },
    3,    // Retry up to 3 times
    1000  // Wait 1 second between retries
  );

  return response;
};
```

### Using Proxies

```typescript
import { fetchWithProxy, PROXY_PROTOCOL } from 'fetch-with-retry3';

const proxies = [
  {
    host: 'proxy1.example.com',
    port: 8080,
    protocol: PROXY_PROTOCOL.http,
    username: 'user1',
    password: 'pass1'
  },
  {
    host: 'proxy2.example.com',
    port: 1080,
    protocol: PROXY_PROTOCOL.socks5,
    username: 'user2',
    password: 'pass2'
  }
];

const response = await fetchWithProxy(
  'https://api.example.com/data',
  { method: 'GET' },
  proxies,
  3,    // attempts
  1500, // delay
  30000 // timeout
);
```

### With AbortController

```typescript
import { fetchWithRetry } from 'fetch-with-retry3';

const controller = new AbortController();

// Cancel request after 5 seconds
setTimeout(() => controller.abort(), 5000);

const response = await fetchWithRetry(
  'https://api.example.com/slow-endpoint',
  {
    method: 'GET',
    signal: controller.signal
  }
);
```

## 🔧 Error Handling

The library automatically handles various error scenarios:

- **Network errors**: Automatic retry with configurable delay
- **Timeout errors**: Uses AbortController for clean cancellation
- **HTTP errors**: 4xx and 5xx status codes (404s return `ok: false`)
- **Proxy failures**: Tries next proxy in the list

```typescript
const response = await fetchWithRetry('https://api.example.com/data');

if (!response.ok) {
  if (response.status === 404) {
    console.log('Resource not found');
  } else if (response.error) {
    console.error('Request failed:', response.error.message);
  }
}
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📊 Package Information

- **NPM Package**: [fetch-with-retry3](https://www.npmjs.com/package/fetch-with-retry3)
- **Repository**: [GitHub](https://github.com/idimetrix/fetch-with-retry)
- **Author**: [Dmitrii Selikhov](https://www.linkedin.com/in/dimetrix)

## 🔗 Related

Built with:
- [Axios](https://axios-http.com/) - Promise based HTTP client
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [tsup](https://tsup.egoist.dev/) - TypeScript bundler
