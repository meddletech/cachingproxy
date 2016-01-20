# cachingproxy
A simple nodejs redis based caching proxy.

This caching proxy takes any request and caches the response in redis. In the first incarnation it works only with GET requests but the aim is to get it working with all verbs.

It uses nodejs streams in order to keep the memory overhead of the app as low as possible, and serves out of the cache when possible. You can configure the port that it runs on by using the environment variable PORT and you can configure the target origin with TARGETORIGIN

License is MIT, feel free to fork and use as a basis for your own strategic caching around existing apis.
