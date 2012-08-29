var _ = require('underscore');
var should = require('should');
var l = require('../main/l.js');

require('../main/express.js');
require('../main/test.js');

before(function (next) {
	l.init.run(next);
});

describe('get hello', function () {
	it('should return hello', function (next) {
		l.test.request.get('/api/hello', function (err, res) {
			res.status.should.equal(200);
			res.body.should.equal('hello');
			next(err);
		});
	});
});
