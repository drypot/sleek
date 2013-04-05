var should = require('should');

var l = require('../main/l');
var config = require('../main/config');

describe('config with invalid path', function () {
	it('should throw', function () {
		(function () {
			config.init({ path: 'config/config-none.json' });
		}).should.throw();
	});
});

describe('config with test: true', function () {
	it('should success', function () {
		(function () {
			config.init({ test: true });
		}).should.not.throw();
	});
});

describe('config with valid path', function () {
	it('should success', function () {
		(function () {
			config.init({ path: 'config/config-test.json' });
		}).should.not.throw();
	});
	it('should have siteTitle', function () {
		config.siteTitle.should.equal("sleek test");
	});
});

