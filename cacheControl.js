'use strict';
var q = require('q');

var CallbackHandler = function(resolve, reject){
	this.handler = function(error, response){
		if(error){
			reject(error);
		}
		else{
			resolve(response);
		}
	};
};

var handleInvalidation = function(request, redis, response){
	return q.Promise(function(resolve, reject){
		var callbackHandler = new CallbackHandler(resolve, reject).handler;
		var matches = /^invalidate=(\*|url)$/.exec(request.headers['cache-control']);
		if(matches){
			if(matches[1] === '*'){
				redis.del('*', callbackHandler);
				response['x-proxy-cache-cleared'] = '*';
			}
			else if(matches[1] === 'url'){
				redis.del(request.redisKey, callbackHandler);
				response['x-proxy-cache-cleared'] = request.redisKey;
			}
		}
		else{
			resolve();
		}		
	});
};

exports.handleInvalidation = handleInvalidation;
