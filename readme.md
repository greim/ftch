**Warning, Experimental** I haven't written tests or anything for this yet, and it almost certainly won't work if you try to use it. Check back soon.

# XFETCH - Extendable Fetching with Telemetry

XFETCH's job is to make requests over HTTP and HTTPS.
It has two notable features:

### Extendability

You instantiate a Fetcher with all the parameters it needs to make HTTP requests by calling the factory with a non-empty signature `(url, options)`. Then you simply make requests using an empty signature `()` and it will make the same request over and over.

Optionally, you may override those parameters at request time by providing the non-empty signature `(url, options)` which is merged into the defaults. That way, you can put all your boilerplate in the factory, and only declare unique bits at fetch time.

Finally, you can extend a Fetcher instance using the non-empty signature `(url, opts)`. This results in a new instance which can be used to make further requests, or can be extended yet again.

### Telemetry

An [EventEmitter](https://nodejs.org/dist/latest-v4.x/docs/api/events.html#events_class_eventemitter) can optionally be passed to any create, fetch, or extend operation to collect in-flight telemetry for each request. This includes latency and timing information, request and response headers, bodies, statuses, etc. This data can then be used to create richer logging for your application.

Note that XFETCH never sends telemetry directly to stdout or stderr. Instead, you pass an event emitters to XFETCH, listen for events on it, and do whatever you want with the data.

## Three Primary Operations

There are three primary operations you can do with XFETCH, each of which accept the exact same `(url, options)` signature, and which perform the same merge operation on that signature.

```js
// Returns a fetcher instance. The given (url, options)
// are merged over a set of global defaults to produce
// a new (url, options) which is used by the returned
// fetcher as its defaults.
xfetch.create(url, options)

// Returns a promise. The given (url, options) are merged
// over this fetcher instance's defaults to produce a new
// (url, options) which is used just for this one request.
fetcher.fetch(url, options)

// Returns a fetcher instance. The given (url, options)
// are merged over this fetcher instance's defaults to
// produce a new (url, options) which is used by the
// returned fetcher as its defaults.
fetcher.extend(url, options)
```

## The Merge Algorithm

When `(url1, opts1)` is merged with `(url2, opts2)` to produce `(finalUrl, finalOpts)`, the following algorithm is used.

 1. `finalUrl = url.resolve(url1, url2)`. This is a no-op unless `url2` is relative. See [url resolve](https://nodejs.org/dist/latest-v4.x/docs/api/url.html#url_url_resolve_from_to).
 2. `finalOpts = Object.assign({}, opts1, opts2)` See [object assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign).
 3. `finalOpts.headers = Object.assign({}, opts1.headers, opts2.headers)`. See [object assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign).

## API documentation

### xftech.create(url, opts)

Creates and returns a fetcher instance.

### Fetcher#fetch(url, opts)

Makes a request and returns a promise resolving on a Node.js [IncomingMessage](https://nodejs.org/dist/latest-v4.x/docs/api/http.html#http_class_http_incomingmessage) (AKA a response object) which has not been depleted yet.

**Note:** Two additional methods are attached to the response object:

 * `response.text()` - Returns a promise which resolves to a string.
 * `response.json()` - Returns a promise which resolves to a JSON object.

### Fetcher#fetchText(url, opts)

Convenience method. These are identical:

```js
fetcher.fetchText(url, opts)
fetcher.fetch(url, opts).then(rs => rs.text())
```

### Fetcher#fetchJson(url, opts)

Convenience method. These are identical:

```js
fetcher.fetchJson(url, opts)
fetcher.fetch(url, opts).then(rs => rs.json())
```

### Fetcher#extend(url, opts)

Creates and returns a new Fetcher instance.

### Options

 * `followRedirects` - Optional, default true in factory. If false, the request will not attempt to follow any redirects it encounters. Otherwise it will follow redirects until it encounters a non-redirect response.
 * `successOnly` - Optional, default true in factory. If false, it will resolve the promise on any response returned by the server. Otherwise it will reject the promise on responses whose status codes aren't between 200 and 299 (inclusive).
 * `method` - Optional, default 'GET' in factory. The request method to use.
 * `body` - Optional, default null. This may be a string, JSON object, buffer or readable stream.
 * `events` - Optional, default null in factory. If provided, must be an [EventEmitter](https://nodejs.org/dist/latest-v4.x/docs/api/events.html#events_class_eventemitter). You may listen for a set of events on this, described below.
 * `headers` - Optional, defaults to empty object in factory. If provided, will be sent as request headers.

### Telemetry events

 * `start` - Happens at the beginning of a fetch.
 * `sent` - Happens when request finishes sending.
 * `redirect` - Happens once for each redirect.
 * `received` - Happens when response is received.
 * `buffered` - Happens when response body is fully buffered into memory.

Every telemetry event handler is passed `(data, timing)`. `data` consists of:

 * `url` - Present at all times.
 * `options` - Present at all times.
 * `requestHeaders` - Present at all times.
 * `requestBody` - Present at all times.
 * `redirects` - Array of URLs. Only present on or after `redirect` event.
 * `responseHeaders` - Only present on or after `received` event.
 * `status` - Only present on or after `received` event.
 * `responseBody` - Only present on or after `buffered` event.

The `timing` argument is an array where each item is an object with the properties:

 * `event` - Name of event.
 * `abs` - Absolute time of event in milliseconds.
 * `rel` - Relative time of event in milliseconds.
