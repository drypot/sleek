var _ = require('underscore');
var should = require('should');
var fs = require('fs');
var path = require('path');

var l = require('../main/l');

var base = '/Users/drypot/tmp/node-test'

before(function (next) {
	try {
		fs.rmdirSync(base + '/sub1/sub2');
		fs.rmdirSync(base + '/sub1');
	} catch (e) {
	}
	next();
});

describe('mkdirs', function () {
	it("confirms base exists", function () {
		should(path.existsSync(base));
	});
	it("confirms sub not exists", function () {
		should(!path.existsSync(base + '/sub1' + '/sub2'));
	});
	it('can make sub1', function (next) {
		l.mkdirs(base, 'sub1', function (err) {
			should(path.existsSync(base + '/sub1'));
			next();
		});
	});
	it('can make sub2', function (next) {
		l.mkdirs(base, 'sub1', 'sub2', function (err, dir) {
			dir.should.equal(base + '/sub1/sub2');
			should(path.existsSync(dir));
			next();
		});
	});
});