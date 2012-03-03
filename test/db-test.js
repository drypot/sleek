var _should = require('should');

var _lang = require('../main/lang');
var _db = require('../main/db');

_lang.addBeforeInit(function (callback) {
	_db.initParam = { mongoDbName: "sleek-test", dropDatabase: true };
	callback();
});
_lang.runInit();

describe('db', function () {
	it('should be ok', function () {
		_db.db.should.be.ok;
	});
	it('should have name', function () {
		_db.db.name.should.equal('sleek-test');
	});
});
