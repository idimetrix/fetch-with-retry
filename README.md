# fetch-with-retry3 (axios-based)
fetch-with-retry3 is a utility function built on top of the Axios library, designed to make HTTP(S) requests with automatic retry logic. When a request fails due to issues like network errors, timeouts, or specific status codes, it retries the operation a set number of times. It can be customized with options like retry count, delay between retries, backoff strategies, and error handling, leveraging Axios' capabilities while enhancing reliability in unstable network environments.

### Options

```
function fetchWithProxy<T = any, D = any>(
  url: string, // URL
  options?: AxiosRequestConfig<D>, // Options (axios based)
  attempts: number = 3, // Number of attempts
  delay: number = 1500, // Delay in milliseconds
  timeout: number = 30 * 1000, // Timeout in milliseconds
): Promise<AxiosResponse<T> & { ok: boolean; error?: Error }>
```

### GET example
``` GET
  import { fetchWithRetry } from 'fetch-with-retry3';

  const result = await fetchWithRetry('https://api.example.com/data', {
    method: 'GET',
  });

  if (result.ok) {
    console.log('GET Request Success:', result.data);
  } else {
    console.error('GET Request Failed:', result.error);
  }
```

### POST example
``` POST
  import { fetchWithRetry } from 'fetch-with-retry3';
  
  const result = await fetchWithRetry('https://api.example.com/data', {
    method: 'POST',
    data: { key: 'value' }, // Example payload
    headers: { 'Content-Type': 'application/json' },
  });

  if (result.ok) {
    console.log('POST Request Success:', result.data);
  } else {
    console.error('POST Request Failed:', result.error);
  }
```

## tsup
Bundle your TypeScript library with no config, powered by esbuild.

https://tsup.egoist.dev/

## How to use this
1. install dependencies
```
# pnpm
$ pnpm install

# yarn
$ yarn install

# npm
$ npm install
```
2. Add your code to `src`
3. Add export statement to `src/index.ts`
4. Test build command to build `src`.
Once the command works properly, you will see `dist` folder.

```zsh
# pnpm
$ pnpm run build

# yarn
$ yarn run build

# npm
$ npm run build
```
5. Publish your package

```zsh
$ npm publish
```


## test package
https://www.npmjs.com/package/fetch-with-retry3
