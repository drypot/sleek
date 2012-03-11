var _should = require('should');

var _l = require('../main/l');
var _db = require('../main/db');

_l.addBeforeInit(function (next) {
	_db.initParam = { mongoDbName: "sleek-test", dropDatabase: true };
	next();
});
_l.runInit();

describe('db', function () {
	it('should be ok', function () {
		_db.db.should.be.ok;
	});
	it('should have name', function () {
		_db.db.name.should.equal('sleek-test');
	});
});
