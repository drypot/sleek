var _ = require('underscore');
var should = require('should');
var fs = require('fs');
var l = require('../main/l.js');

describe('property', function () {
	it('should', function () {
		l.def({x: 'def'}, 'x', 'abc').should.equal('def');
		l.def({y: 'def'}, 'x', 'abc').should.equal('abc');
		l.def(null, 'x', 'abc').should.equal('abc');
	});

	describe('defInt', function () {
		it('should', function () {
			l.defInt({x: '10'}, 'x', 30).should.equal(10);
			l.defInt({x: 10}, 'x', 30).should.equal(10);
			l.defInt({x: 'def'}, 'x', 30).should.equal(30);
			l.defInt({y: '10'}, 'x', 30).should.equal(30);
			l.defInt(null, 'x', 30).should.equal(30);
		});
	});

	describe('defInt', function () {
		it('should', function () {
			l.defInt({x: '10'}, 'x', 30, 0, 50).should.equal(10);
			l.defInt({x: 10}, 'x', 30, 0, 50).should.equal(10);
			l.defInt({x: 'def'}, 'x', 30, 0, 50).should.equal(30);
			l.defInt({y: '10'}, 'x', 30, 0, 50).should.equal(30);
			l.defInt(null, 'x', 30, 0, 50).should.equal(30);
			l.defInt({x: 60}, 'x', 30, 0, 50).should.equal(50);
			l.defInt({x: -60}, 'x', 30, 0, 50).should.equal(0);
		});
	});

	describe('defString', function () {
		it('should', function () {
			l.defString({x: 'def'}, 'x', 'abc').should.equal('def');
			l.defString({x: 10}, 'x', 'abc').should.equal('10');
			l.defString({x: ' def '}, 'x', 'abc').should.equal('def');
			l.defString({y: 'def'}, 'x', 'abc').should.equal('abc');
			l.defString(null, 'x', 'abc').should.equal('abc');
		});
	});

	describe('defBool', function () {
		it('should', function () {
			l.defBool({x: 'true'}, 'x', true).should.equal(true);
			l.defBool({x: true}, 'x', true).should.equal(true);
			l.defBool({x: 'false'}, 'x', true).should.equal(false);
			l.defBool({x: false}, 'x', true).should.equal(false);
			l.defBool({y: true}, 'x', true).should.equal(true);
			l.defBool({y: true}, 'x', false).should.equal(false);
			l.defBool({y: false}, 'x', true).should.equal(true);
			l.defBool(null, 'x', true).should.equal(true);
			l.defBool(null, 'x', false).should.equal(false);
		});
	});

	describe('mergeProperty', function () {
		var src = {
			f1 : 1,
			f2 : 2,
			f3 : undefined,
			f4 : 4
		}
		it('can copy selected properties', function () {
			var tar = l.mergeProperty({}, src, ['f1', 'f2', 'f3']);
			tar.should.ok;
			tar.should.have.keys(['f1', 'f2', 'f3']);
			tar.f2.should.equal(2);
			should.equal(undefined, tar.f3);
		})
	});
});

describe('init', function () {
	it('can add sync func', function (next) {
		var a = [];
		l.init.reset();
		l.init.init(function () {
			a.push(3);
		});
		l.init.run(function () {
			a.should.length(1);
			a[0].should.equal(3);
			next();
		});
	});

	it('can add async func', function (next) {
		var a = [];
		l.init.reset();
		l.init.init(function (next) {
			a.push(33);
			next();
		});
		l.init.run(function () {
			a.should.length(1);
			a[0].should.equal(33);
			next();
		});
	});

	it('can add before func', function (next) {
		var a = [];
		l.init.reset();
		l.init.beforeInit(function () {
			a.push(1);
		});
		l.init.init(function () {
			a.push(2);
		});
		l.init.beforeInit(function () {
			a.push(3);
		});
		l.init.run(function () {
			a.should.length(3);
			a[0].should.equal(1);
			a[1].should.equal(3);
			a[2].should.equal(2);
			next();
		});
	});

	it('can add after func', function (next) {
		var a = [];
		l.init.reset();
		l.init.afterInit(function () {
			a.push(1);
		});
		l.init.init(function () {
			a.push(2);
		});
		l.init.afterInit(function () {
			a.push(3);
		});
		l.init.run(function () {
			a.should.length(3);
			a[0].should.equal(2);
			a[1].should.equal(1);
			a[2].should.equal(3);
			next();
		});
	});
});

