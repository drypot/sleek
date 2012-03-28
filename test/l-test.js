var _ = require('underscore');
var should = require('should');
var path = require('path');
var fs = require('fs');

var l = require('../main/l.js');

describe('initList', function () {
	var a = [];
	before(function (next) {
		l.init.add(function (next) {
			a.push(2);
			next();
		});
		l.init.addAfter(function (next) {
			a.push(3);
			next();
		});
		l.init.addBefore(function (next) {
			a.push(1);
			next();
		});
		l.init.run(next);
	});
	it('should have 1, 2, 3', function () {
		a[0].should.equal(1);
		a[1].should.equal(2);
		a[2].should.equal(3);
	})
})

describe('p', function () {
	it('should', function () {
		l.p({x: 'def'}, 'x', 'abc').should.equal('def');
		l.p({y: 'def'}, 'x', 'abc').should.equal('abc');
		l.p(null, 'x', 'abc').should.equal('abc');
	});

	describe('int', function () {
		it('should', function () {
			l.p.int({x: '10'}, 'x', 30).should.equal(10);
			l.p.int({x: 10}, 'x', 30).should.equal(10);
			l.p.int({x: 'def'}, 'x', 30).should.equal(30);
			l.p.int({y: '10'}, 'x', 30).should.equal(30);
			l.p.int(null, 'x', 30).should.equal(30);
		});
	});

	describe('intMax', function () {
		it('should', function () {
			l.p.intMax({x: '10'}, 'x', 30, 50).should.equal(10);
			l.p.intMax({x: 10}, 'x', 30, 50).should.equal(10);
			l.p.intMax({x: 'def'}, 'x', 30, 50).should.equal(30);
			l.p.intMax({y: '10'}, 'x', 30, 50).should.equal(30);
			l.p.intMax(null, 'x', 30, 50).should.equal(30);
			l.p.intMax({x: 60}, 'x', 30, 50).should.equal(50);
		});
	});

	describe('string', function () {
		it('should', function () {
			l.p.string({x: 'def'}, 'x', 'abc').should.equal('def');
			l.p.string({x: 10}, 'x', 'abc').should.equal('10');
			l.p.string({x: ' def '}, 'x', 'abc').should.equal('def');
			l.p.string({y: 'def'}, 'x', 'abc').should.equal('abc');
			l.p.string(null, 'x', 'abc').should.equal('abc');
		});
	});

	describe('bool', function () {
		it('should', function () {
			l.p.bool({x: 'true'}, 'x', true).should.equal(true);
			l.p.bool({x: true}, 'x', true).should.equal(true);
			l.p.bool({x: 'false'}, 'x', true).should.equal(false);
			l.p.bool({x: false}, 'x', true).should.equal(false);
			l.p.bool({y: true}, 'x', true).should.equal(true);
			l.p.bool({y: true}, 'x', false).should.equal(false);
			l.p.bool({y: false}, 'x', true).should.equal(true);
			l.p.bool(null, 'x', true).should.equal(true);
			l.p.bool(null, 'x', false).should.equal(false);
		});
	});

	describe('merge', function () {
		var src = {
			f1 : 1,
			f2 : 2,
			f3 : undefined,
			f4 : 4
		}
		it('can copy selected properties', function () {
			var tar = l.p.merge({}, src, ['f1', 'f2', 'f3']);
			tar.should.ok;
			tar.should.have.keys(['f1', 'f2', 'f3']);
			tar.f2.should.equal(2);
			should.equal(undefined, tar.f3);
		})
	});
});

describe('fs', function () {
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
			l.fs.mkdirs([base, 'sub1'], function (err) {
				should(path.existsSync(base + '/sub1'));
				next();
			});
		});
		it('can make sub2', function (next) {
			l.fs.mkdirs([base, 'sub1', 'sub2'], function (err, dir) {
				dir.should.equal(base + '/sub1/sub2');
				should(path.existsSync(dir));
				next();
			});
		});
	});
});
