var should = require('should');

describe('config with invalid path', function () {
	it('should throw', function () {
		(function () {
			var config = require('../main/config')({ path: 'config/config-none.json' });
		}).should.throw();
	});
});

describe('config with test: true', function () {
	it('should success', function () {
		var config = require('../main/config')({ test: true });
		config.siteTitle.should.equal("sleek test");
	});
});

describe('config with valid path', function () {
	it('should success', function () {
		var config = require('../main/config')({ path: 'config/config-test.json' });
		config.siteTitle.should.equal("sleek test");
	});
});