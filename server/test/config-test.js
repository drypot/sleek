var should = require('should');

var l = require('../main/l.js');
var config = require('../main/config.js');

describe('loading config', function () {
	it('should fail with invalid path', function (next) {
		config.init({ path: 'config/config-none.json' }, function (err) {
			should(err);
			next();
		});
	});
	it('should success', function (next) {
		config.init({ path: 'config/config-test.json' }, next);
	});
});

describe('config property', function () {
	it('should have siteTitle', function () {
		config.siteTitle.should.equal("sleek test");
	});
})