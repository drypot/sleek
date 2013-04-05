var should = require('should');

var config = require('../main/config');

describe('config with invalid path', function () {
	it('should throw', function () {
		(function () {
			config({ path: 'config/config-none.json' }, function (config) {});
		}).should.throw();
	});
});

describe('config with test: true', function () {
	it('should success', function () {
		config({ test: true }, function (config) {
			config.siteTitle.should.equal("sleek test");
		});
	});
});

describe('config with valid path', function () {
	it('should success', function () {
		config({ path: 'config/config-test.json' }, function (config) {
			config.siteTitle.should.equal("sleek test");
		});
	});
});