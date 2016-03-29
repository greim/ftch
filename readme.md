# ftch :: Secure, extensible fetching with telemetry

ftch is a Node.js library for doing HTTP requests, focusing on:

 1. Security
 2. Extensibility
 3. Telemetry

### Security

Request URLs are often constructed dynamically. To mitigate risk of command-injection attacks, ftch uses URL templates with automatic URL-encoding.

```js
fetch('https://api.example.com/api/users/:id', {
  id: untrustedParams.id
}).then(user => ...);
```

### Extensibility

ftch's extensibility mechanism helps minimize boilerplate.

```js
// declare boilerplate here...
const api = fetch.extend('https://api.example.com/api/', {}, {
  as: 'json',
  accept: 'application/json',
});

// elsewhere...
api('users/:id', { id: params.id })
.then(user => ...);
```

### Telemetry

ftch allows optionally passing in an [EventEmitter](https://nodejs.org/dist/latest-v4.x/docs/api/events.html#events_class_eventemitter) to collect in-flight telemetry for each request.

```js
// log the progress of every completed request
const telemetry = new EventEmitter();
telemetry.on('request-end', (data, history) => { console.log(history); });
const api = fetch.extend('https://localhost/api/', null, { telemetry });
```

## API

### `fetch(urlTemplate, params, options)`

Makes an HTTP(S) request and returns a promise. By default the returned promise resolves to a Node.js response stream, AKA an [http.IncomingMessage](https://nodejs.org/dist/latest-v4.x/docs/api/http.html#http_class_http_incomingmessage). Optionally, it can be made to resolve directly to a buffer, string, or JSON object. Arguments are described below.

#### `urlTemplate`

Optional URL template string. If provided, it will be a URL pattern capturing zero or more named variables, for example `:id` or `:version`. URL patterns may optionally include scheme, host and port, but named variables may only exist in the path portion of the URL. Examples:

 * https://example.com/api/:version/
 * /users/:id
 * /posts/:id/comments?from=:from&to=:to

At request time, it's executed against the `params` argument, described below. Note that *all* params declared in the URL template must be provided, otherwise the promise will be rejected.

#### `params`

Optional params object. If `urlTemplate` (described above) contains any free variables, this argument must be an object whose properties match all those variables. Values are coerced to strings and URL-encoded. `null` and `undefined` are treated as empty strings.

#### `options`

All options are optional, and the overall `options` object is also optional. Here are the available options:

 * **headers**: Object containing HTTP headers.
 * **body**: The request body. Either a buffer, string, object, or readable stream.
 * **as**: The type of thing you want the promise to resolve to. Allowed values include `'text'`, `'json'`, `'buffer'`, or `'stream'` (default).
 * **followRedirects**: If true, redirects will be followed. Defaults to `true`.
 * **successOnly**: If true, reject the promise for all but 2xx range response status codes (after redirects are followed). Default to `true`.
 * **method**: HTTP method to use. Defaults to `'GET'`.
 * **query**: An object containing query string params that will be added to the request URL. If the request URL already contains a query string, these will be merged in.
 * **telemetry**: A node [EventEmitter](https://nodejs.org/dist/latest-v4.x/docs/api/events.html#events_class_eventemitter) object which you provide. ftch will emit events on this object for the progress and timing of the request. It's then your responsibility to listen for events on this object.

### `fetch.extend(urlTemplate, params, options)`

Returns a function with extended defaults. Consider these scenarios:

```js
const parent = require('ftch');

// scenario 1
parent(url, params, opts);

// scenario 2
const child = parent.extend(url, params, opts);

// scenario 3
child(url, params, opts);
```

When `parent` is called in scenario 1, the given `(url, params, opts)` is merged into a set of global defaults, using the *merge algorithm* described below. The result is used to make the request and then discarded.

When `parent.extend` is called in scenario 2, the given `(url, params, opts)` is merged into the above-mentioned set of global defaults, using the above-mentioned merge algorithm. The result is *not* discarded, but rather becomes defaults for subsequent calls on `child`.

When `child` is called in scenario 3, the given `(url, params, opts)` is merged into the above-mentioned child defaults. The result is used to make the request and then discarded.

The chain continues as `extend` is called on subsequent children.

#### The Merge Algorithm

#### `urlTemplate1 <= urlTemplate2`

Since URL templates are valid URLs, [node's URL resolution algorithm](https://nodejs.org/dist/latest-v4.x/docs/api/url.html#url_url_resolve_from_to) is used here:

```js
const mergedUrl = url.resolve(urlTemplate1, urlTemplate2);
```

#### `params1 <= params2`

A standard JavaScript *object assign* is used here:

```js
const mergedParams = Object.assign({}, params1, params2);
```

#### `options1 <= options2`

Options merge using one of three strategies:

 * **overwrite**: *next* replaces *prev*.
 * **object-assign**: Object assign *prev* <= *next*.
 * **array-push**: *next* is pushed onto an array containing all *prev* values.

Here's how each option gets merged:

 * **headers**: object-assign
 * **body**: overwrite
 * **as**: overwrite
 * **followRedirects**: overwrite
 * **successOnly**: overwrite
 * **method**: overwrite
 * **query**: object-assign
 * **telemetry**: array-push

Additionally, any of the following properties found on the options object are passed through to the underlying node.js request: `family`, `auth`, `agent`, `pfx`, `key`, `passphrase`, `cert`, `ca`, `ciphers`, `rejectUnauthorized`, `secureProtocol`, and `servername`. Docs for these can be found [here](https://nodejs.org/dist/latest-v4.x/docs/api/http.html#http_http_request_options_callback) and [here](https://nodejs.org/dist/latest-v4.x/docs/api/https.html#https_https_request_options_callback). All of these extend using the above-mentioned *overwrite* strategy.
