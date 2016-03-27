**Warning, Experimental** I haven't written tests or anything for this yet, and it almost certainly won't work if you try to use it. Check back soon.

# XXX - Secure, Extendable Fetching with Telemetry

XXX is a request-over-HTTP library with two stand-out features:

### Security

Often request URLs must be constructed using untrusted data. To mitigate risk of command-injection vulnerabilities, XXX uses URL templates with automatic escaping.

### Extensibility

To avoid writing boilerplate for each request, e.g. accept headers and hostnames, XXX introduces extensibility mechanisms, similar to how JavaScript functions can be partially applied. This minimizes boilerplate for each request.

### Telemetry

A request is like a rocket that takes off, leaving you standing on the ground wondering what's happening. Did stage 1 separate? Is it at the expected altitude? XXX allows optionally passing in an [EventEmitter](https://nodejs.org/dist/latest-v4.x/docs/api/events.html#events_class_eventemitter) to collect in-flight telemetry for each request.

## API

### `fetch(urlTemplate, params, options)`

Makes an HTTP(S) request and returns a promise, which resolves to either a string, buffer, JSON object, or response object, depending on the `options` object that is passed in.

#### `urlTemplate`

Optional URL template string. If provided, it will be a URL pattern capturing zero or more named variables. Examples of valid URL patterns include:

 * https://example.com/
 * /api/:version/
 * /users/:id
 * /posts/:id/comments?from=:from&to=:to

At request time, the given URL template is executed against the `params` object, described below. All params declared in the URL template must be provided, otherwise the request promise will be rejected.

#### `params`

Optional params object. If the `urlTemplate` contains any variables, this argument must be an object whose properties must match every template variable. Values will be coerced to strings and URL-encoded. `null` and `undefined` will be treated as empty strings.

#### `options`

Optional. Options include:

 * **headers**: Object containing HTTP headers. Defaults to an empty object.
 * **body**: Either null, buffer, string, object, or readable stream. Defaults to `null`.
 * **as**: Either `'text'`, `'json'`, `'buffer'`, or `'stream'`.
 * **followRedirects**: If true, redirects will be followed. Default true.
 * **successOnly**: If true, reject the promise for all but 2xx range response status codes (after redirects are followed). Default true.
 * **method**: HTTP method to use. Default `'GET'`. Uppercase enforced.
 * **query**: An object containing querystring parameters that will be added to the request URL.
 * **telemetry**: A node [EventEmitter](https://nodejs.org/dist/latest-v4.x/docs/api/events.html#events_class_eventemitter) object which you provide. XXX will emit events on this object for the progress and timing of the request. It's then your responsibility to listen for `'progress'` events on this object.
 * **requestOpts** Optional options object which is merged into the options passed to `http.request` or `https.request`.

### `fetch.extend(urlTemplate, params, options)`

Returns a function with extended defaults. Let's consider these scenarios:

```js
const parent = require('XXX');

// scenario 1
parent(url, params, opts);

// scenario 2
const child = parent.extend(url, params, opts);

// scenario 3
child(url, params, opts);
```

When `parent` is called in scenario 1, the given `(url, params, opts)` is merged into a set of global defaults, using the *merge algorithm* described below. The merged configuration data is used to make the request and then discarded.

When `parent.extend` is called in scenario 2, the given `(url, params, opts)` is merged into the above-mentioned set of global defaults, using the above-mentioned merge algorithm. The merged configuration data is *not* discarded, but becomes the defaults for subsequent calls on `child`.

When `child` is called in scenario 3, the given `(url, params, opts)` is merged into the above-mentioned child defaults. The merged configuration data is used to make the request and then discarded.

The same happens each time `extend` is called.

#### The Merge Algorithm

#### `urlTemplate1 <= urlTemplate2`

Since URL templates are valid URLs, [node's URL resolution algorithm](https://nodejs.org/dist/latest-v4.x/docs/api/url.html#url_url_resolve_from_to) is used to perform this merge:

```js
const mergedUrl = url.resolve(urlTemplate1, urlTemplate2);
```

Examples:

```
https://foo.com/ <= api/users/:id == https://foo.com/api/users/:id
https://foo.com/bar <= api/users/:id == https://foo.com/api/users/:id
https://foo.com/bar/ <= api/users/:id == https://foo.com/bar/api/users/:id
https://foo.com/bar/ <= /api/users/:id == https://foo.com/api/users/:id
https://foo.com/ <= https://bar.com/ == https://bar.com/
https://foo.com/ <= //bar.com/ == https://bar.com/
```

#### `params1 <= params2`

A standard JavaScript *object assign* is used here:

```js
const mergedParams = Object.assign({}, params1, params2);
```

#### `options1 <= options2`

Options merge one of three ways:

 * **overwrite**: The *next* val replaces the *prev* one. The *next* val is then used.
 * **array-push**: The *next* val is pushed onto an array containing all *prev* values. The entire array is then used.
 * **object-assign**: The *next* and *prev* vals are objects. The standard JavaScript object assign algorithm is used to produce a merged object, which is then used.

Here are how each option is merged.

 * **headers**: object-assign
 * **body**: overwrite
 * **as**: overwrite
 * **followRedirects**: overwrite
 * **successOnly**: overwrite
 * **method**: overwrite
 * **query**: object-assign
 * **telemetry**: array-push
 * **requestOpts**: object-assign
