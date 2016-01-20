var logger = require('winston');
var port = process.env.PORT || 5000;
logger.info('port set to', port);

var
    url = require('url'),
    http = require('http'),
    acceptor = http.createServer().listen(port),
    pass = require('stream').PassThrough,
    redis = require('redis').createClient(),
    utils = require('./utils');   

var targetOrigin = process.env.TARGETORIGIN || 'http://localhost';
var target = utils.parseTargetOrigin(targetOrigin);

logger.info('target origin', target);

var proxy = function(request, response){
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
        var expire = 5 * 60; // 8 hours
        redis.set(request.url, JSON.stringify(redisObject), 'NX', 'EX', expire);
    });

    var connector = http.request(options, function(serverResponse) {
        response.writeHeader(serverResponse.statusCode, serverResponse.headers);
        redisObject.statusCode = serverResponse.statusCode;
        redisObject.headers = serverResponse.headers;
        serverResponse.pipe(caching);
        serverResponse.pipe(response);
    });

    request.pipe(connector);   
};

acceptor.on('request', function(request, response) {
    redis.get(request.url, function(error, redisResponse) {
        if(redisResponse){
            var responseObject = JSON.parse(redisResponse);
            response.writeHeader(responseObject.statusCode, responseObject.headers);
            response.write(new Buffer(responseObject.response.data));
            response.end();
        }
        else{
                proxy(request, response);
            }
    });
});
