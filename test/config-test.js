var should = require('should');
var l = require('../main/l.js');

require('../main/config.js');
require('../main/test.js');

before(function (next) {
	l.init.run(next);
});

describe('config', function () {
	it('should have path', function () {
		should(l.config.path);
		l.config.path.should.equal("config-dev/config-test.json");
	});

	it('should have siteTitle', function () {
		l.config.siteTitle.should.equal("sleek test");
	});
});