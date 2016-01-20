'use strict';

var assert = require('assert');
var utils = require('../utils.js');

describe('parseTargetOrigin', function(){
	it('picks up scheme', function(){
		var target = utils.parseTargetOrigin('http://localhost');
		assert.equal(target.scheme, 'http');
	});

	it('picks up host when port present', function(){
		var target = utils.parseTargetOrigin('http://localhost:5000');
		assert.equal(target.host, 'localhost');
	});

	it('picks up host when no port present', function(){
		var target = utils.parseTargetOrigin('http://localhost');
		assert.equal(target.host, 'localhost');
	});

	it('picks up port', function(){
		var target = utils.parseTargetOrigin('http://localhost:5000');
		assert.equal(target.port, '5000');
	});
});		