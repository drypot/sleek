var _ = require('underscore');
var _should = require('should');
var _fs = require('fs');
var _path = require('path');

var _l = require('../main/l');

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
		_should(_path.existsSync(base));
	});
});

describe("test sub,", function () {
	it("should not exists", function () {
		_should(!_path.existsSync(base + '/sub1' + '/sub2'));
	});
});

describe('mkdirs,', function () {
	it('can make sub1', function (next) {
		_l.mkdirs(base, 'sub1', function (err) {
			_should(_path.existsSync(base + '/sub1'));
			next();
		});
	});
	it('can make sub2', function (next) {
		_l.mkdirs(base, 'sub1', 'sub2', function (err, dir) {
			dir.should.equal(base + '/sub1/sub2');
			_should(_path.existsSync(dir));
			next();
		});
	});
});