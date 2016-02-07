# cachingproxy
A simple nodejs redis based caching proxy.

This caching proxy takes any request and caches the response in redis. In the first incarnation it works only with GET requests but the aim is to get it working with all verbs.

It uses nodejs streams in order to keep the memory overhead of the app as low as possible, and serves out of the cache when possible

##configuration
The following paraemeters can be configured through environmental variables
REDISDB      : the redis db index (0-15 on default redis instance)
PORT	     : the port that the cacheproxy will listen on
TARGETORIGIN : the origin of the remote server to send all requests to
CACHELENGTH  : the length of time in seconds that the request responses will be kept in the cache 

##running
npm start

##cache response headers
When the caching proxy serves something from the cache, rather than the target you will see the header x-proxy-cache set to true in the response headers.

##cache control
Instructions can be sent to the cache using the header Cache-Control in requests made to the caching proxy. 

### Invalidate the cache for url being requested
When making a request, pass the header Cache-Control with a value of invalidate=url. This will force the cache to go to the original target for the request (which will be subsequently cached). You can inspect whether the cache respected the request to invalidate the cache for that url by looking at the headers in the response. If the proxy invalidated the cache for the request you will see the header x-proxy-cache-cleared with the value url.

Here is an example of a request with a cache invalidation instruction for *just the url*:

```
curl -I http://localhost:5001/questions/35243433/styling-a-legend-in-d3 -H "Cache-Control: invalidate=url"
```

### Invalidate all entries in the cache
When making a request, pass the header Cache-Control with a value of invalidate=*. This will instruct the cache to clear itself completely. The request being made and all subsequent requests to new urls will be retreived from the original target (all of which will be subsequently cached). You can inspect whether the cache respected the request to invalidate the entire cache by looking at the headers in the response. If the proxy invalidated the cache for the request you will see the header x-proxy-cache-cleared with the value *.

Here is an exmaple of a request with a cache invalidation instruction *for the whole cache*

```
curl -I http://localhost:5001/questions/35243433/styling-a-legend-in-d3 -H "Cache-Control: invalidate=*"
```

License is MIT, feel free to fork and use as a basis for your own strategic caching around existing apis.
