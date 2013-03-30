var should = require('should');
var l = require('../main/l.js');
var config = require('../main/config.js');

describe('config', function () {
	it('given config', function () {
		config.load('config/config-test.json');
	});
	it('siteTitle', function () {
		config.siteTitle.should.equal("sleek test");
	});
});