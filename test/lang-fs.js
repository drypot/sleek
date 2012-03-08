var _ = require('underscore');
var _should = require('should');
var _fs = require('fs');
var _path = require('path');

var _lang = require('../main/lang');

var base = '/Users/drypot/tmp/node-test'

before(function (next) {
	try {
		_fs.rmdirSync(base + '/sub1/sub2');
		_fs.rmdirSync(base + '/sub1');
	} catch (e) {
	}
	next();
});

describe("test base,", function () {
	it("should exists", function () {
		_should.ok(_path.existsSync(base));
	});
});

describe("test sub,", function () {
	it("should not exists", function () {
		_should.ok(!_path.existsSync(base + '/sub1' + '/sub2'));
	});
});

describe('mkdirs,', function () {
	it('can make sub1', function (next) {
		_lang.mkdirs(base, 'sub1', function (err) {
			_should.ok(_path.existsSync(base + '/sub1'));
			next();
		});
	});
	it('can make sub2', function (next) {
		_lang.mkdirs(base, 'sub1', 'sub2', function (err, dir) {
			dir.should.equal(base + '/sub1/sub2');
			_should.ok(_path.existsSync(dir));
			next();
		});
	});
});