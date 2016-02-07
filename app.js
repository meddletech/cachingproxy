var logger = require('winston');
var port = process.env.PORT || 5000;
logger.info('port set to', port);

var redisDb = process.env.REDISDB || 1;
logger.info('redis db set to', redisDb);

var
    url = require('url'),
    http = require('http'),
    acceptor = http.createServer().listen(port),
    pass = require('stream').PassThrough,
    redis = require('redis').createClient(),
    utils = require('./utils'),
    cacheControl = require('./cacheControl.js'),
    q = require('q');   

redis.select(redisDb, function(err,res){
  if(err){
    logger.error('error during redis database select', err);
  }
  else{
    logger.info('redis db selected', res);
  }
});

var targetOrigin = process.env.TARGETORIGIN || 'http://localhost';
var target = utils.parseTargetOrigin(targetOrigin);
logger.info('target origin', target);

var cacheLength = process.env.CACHELENGTH || 30 * 60; // 30 minutes
logger.info('cahce length', cacheLength);

var serveFromTarget = function(request, response){
    return q.Promise(function(resolve, reject){
        var options = url.parse(targetOrigin + request.url);
        options.headers = request.headers;
        options.method = request.method;
        options.headers.host = target.host;

        var caching = new pass();
        var redisCachedResponse = [];
        var totalLength = 0;
        caching.on('data', function(chunk){
            redisCachedResponse.push(chunk);
            totalLength += chunk.length;
        });

        var redisObject = {};

        caching.on('end', function(){
            redisObject.response = Buffer.concat(redisCachedResponse, totalLength);
            var expire = cacheLength;

            redis.set(request.redisKey, JSON.stringify(redisObject), 'NX', 'EX', expire, function(error){
                if(error){
                    reject(error);
                }
                else{
                    resolve();
                }
            });
        });

        var connector = http.request(options, function(serverResponse) {
            if(response['x-proxy-cache-cleared']){
                serverResponse.headers['x-proxy-cache-cleared'] = response['x-proxy-cache-cleared'];
            }

            response.writeHeader(serverResponse.statusCode, serverResponse.headers);
            redisObject.statusCode = serverResponse.statusCode;
            redisObject.headers = serverResponse.headers;
            serverResponse.pipe(caching);
            serverResponse.pipe(response);
        });

        var bodyStream = new pass();
        request.bodyChunks.forEach(function(chunk){
            bodyStream.write(chunk);
        });

        bodyStream.end();

        bodyStream.pipe(connector);   
    });
};

var handleError = function(error){
    console.log('error serving request: ', error);
};

var ProxyRequest = function(request, response, redis){
    var Serve = function(redisKey, resolve, reject){
        var serveFromRedis = function(redisResponse){
            var responseObject = JSON.parse(redisResponse);
            
            responseObject.headers['x-proxy-cache'] = true;
            response.writeHeader(responseObject.statusCode, responseObject.headers);
            response.write(new Buffer(responseObject.response.data));
            response.end();
            resolve();
        };

        this.handle = function(){
            redis.get(redisKey, function(error, redisResponse) {
                if(error){
                    reject(error);
                }
                else if(redisResponse){
                    return serveFromRedis(redisResponse);
                }
                else{
                    return serveFromTarget(request, response);
                }
            });
        };
    };

    this.handle = function(){
        return q.Promise(function(resolve, reject){
            var requestReader = new pass();
            var chunks = [];
            var chunksLength = 0;
            requestReader.on('data', function(chunk){
                chunks.push(chunk);
                chunksLength += chunk.length;
            });

            requestReader.on('end', function(){
                request.bodyChunks = chunks;

                var body = Buffer.concat(chunks, chunksLength);
                
                var redisKey = {
                    url: request.url,
                    body: body,
                    method: request.method
                };

                request.redisKey = 'pc:' + JSON.stringify(redisKey);

                cacheControl.handleInvalidation(request, redis, response)
                .then(new Serve(request.redisKey, resolve, reject).handle)
                .catch(handleError)
                .done();
            });

            request.pipe(requestReader);
        });
    };
};

acceptor.on('request', function(request, response) {
    new ProxyRequest(request, response, redis).handle();
});
