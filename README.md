# cachingproxy
A simple nodejs redis based caching proxy.

This caching proxy takes any request and caches the response in redis. In the first incarnation it works only with GET requests but the aim is to get it working with all verbs.

It uses nodejs streams in order to keep the memory overhead of the app as low as possible, and serves out of the cache when possible

##configuration
The following paraemeters can be configured through environmental variables
PORT	     : the port that the cacheproxy will listen on
TARGETORIGIN : the origin of the remote server to send all requests to
CACHELENGTH  : the length of time in seconds that the request responses will be kept in the cache 

##running
npm start


License is MIT, feel free to fork and use as a basis for your own strategic caching around existing apis.
