var assert = require('assert');
var cacheControl = require('../cacheControl.js');

var Redis = function(){
	var deletedKey = '';
	this.del = function(key, callback) {
		deletedKey = key;
		callback(null, '');
	};

	this.deletedKey = function(){
		return deletedKey;
	};
};

describe('cacheControl.handleValidation', function(){
	it('invalidates all keys', function(){
		var redis = new Redis('*');

		var request = {
			headers: {
				'cache-control': 'invalidate=*'
			}
		};

		cacheControl.handleInvalidation(request, redis)
		.then(function(){
			assert.equal(redis.deletedKey(), '*');		
		});
	});

	it('invalidates url', function(){
		var redis = new Redis('http://www.example.com');

		var request = {
			headers: {
				'cache-control': 'invalidate=url'
			},
			redisKey: 'http://www.example.com'
		};

		return cacheControl.handleInvalidation(request, redis)
		.then(function(){
			assert.equal(redis.deletedKey(), 'http://www.example.com');		
		});
	});

	it('ignores unknown options', function(){
		var redis = new Redis();

		var request = {
			headers: {
				'cache-control': 'invalidate=other'
			},
			url: 'http://www.example.com'
		};

		cacheControl.handleInvalidation(request, redis)
		.then(function(){
			assert.equal(redis.deletedKey(), '');		
		});

	});

	it('ignores requests without cache-control directive', function(){
		var redis = new Redis();

		var request = {
			headers: {
				'cache-control': 'invalidate=other'
			},
			url: 'http://www.example.com'
		};

		cacheControl.handleInvalidation(request, redis)
		.then(function(){
			assert.equal(redis.deletedKey(), '');		
		});
	});
});