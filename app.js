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
        var expire = 5 * 60; // 5 minutes

        redis.set(JSON.stringify(request.redisKey), JSON.stringify(redisObject), 'NX', 'EX', expire);
    });

    var connector = http.request(options, function(serverResponse) {
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
};

acceptor.on('request', function(request, response) {

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

        request.redisKey = redisKey;

        redis.get(JSON.stringify(redisKey), function(error, redisResponse) {
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

    request.pipe(requestReader);
});
