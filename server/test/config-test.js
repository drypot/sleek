var should = require('should');

var config = require('../main/config');

describe('config with invalid path', function () {
	before(function () {
		config.reset();
	});
	it('should throw', function () {
		(function () {
			config.options({ path: 'config/config-none.json' });
			config.init();
		}).should.throw();
	});
});

describe('config with test: true', function () {
	before(function () {
		config.reset();
	});
	it('should success', function () {
		config.options({ test: true });
		config.init();
		config.data.siteTitle.should.equal("sleek test");
	});
});

describe('config with valid path', function () {
	before(function () {
		config.reset();
	});
	it('should success', function () {
		config.options({ path: 'config/config-test.json' });
		config.init();
		config.data.siteTitle.should.equal("sleek test");
	});
});