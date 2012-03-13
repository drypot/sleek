var _ = require('underscore');
var should = require('should');

var l = require('../main/l.js');

describe('initList', function () {
	var a = [];
	before(function (next) {
		l.addInit(function (next) {
			a.push(2);
			next();
		});
		l.addAfterInit(function (next) {
			a.push(3);
			next();
		});
		l.addBeforeInit(function (next) {
			a.push(1);
			next();
		});
		l.runInit(next);
	});
	it('should have 1, 2, 3', function () {
		a[0].should.equal(1);
		a[1].should.equal(2);
		a[2].should.equal(3);
	})
})

describe('merge', function () {
	var src = {
		f1 : 1,
		f2 : 2,
		f3 : undefined,
		f4 : 4
	}
	it('can copy selected properties', function () {
		var tar = l.merge({}, src, ['f1', 'f2', 'f3']);
		tar.should.ok;
		tar.should.have.keys(['f1', 'f2', 'f3']);
		tar.f2.should.equal(2);
		should.equal(undefined, tar.f3);
	})
});

describe('p', function () {
	it('should', function () {
		l.p({x: 'def'}, 'x', 'abc').should.equal('def');
		l.p({y: 'def'}, 'x', 'abc').should.equal('abc');
		l.p(null, 'x', 'abc').should.equal('abc');
	});
});

describe('intp', function () {
	it('should', function () {
		l.intp({x: '10'}, 'x', 30).should.equal(10);
		l.intp({x: 10}, 'x', 30).should.equal(10);
		l.intp({x: 'def'}, 'x', 30).should.equal(30);
		l.intp({y: '10'}, 'x', 30).should.equal(30);
		l.intp(null, 'x', 30).should.equal(30);
	});
});

describe('strp', function () {
	it('should', function () {
		l.strp({x: 'def'}, 'x', 'abc').should.equal('def');
		l.strp({x: 10}, 'x', 'abc').should.equal('10');
		l.strp({x: ' def '}, 'x', 'abc').should.equal('def');
		l.strp({y: 'def'}, 'x', 'abc').should.equal('abc');
		l.strp(null, 'x', 'abc').should.equal('abc');
	});
});

describe('boolp', function () {
	it('should', function () {
		l.boolp({x: 'true'}, 'x', true).should.equal(true);
		l.boolp({x: true}, 'x', true).should.equal(true);
		l.boolp({x: 'false'}, 'x', true).should.equal(false);
		l.boolp({x: false}, 'x', true).should.equal(false);
		l.boolp({y: true}, 'x', true).should.equal(true);
		l.boolp({y: true}, 'x', false).should.equal(false);
		l.boolp({y: false}, 'x', true).should.equal(true);
		l.boolp(null, 'x', true).should.equal(true);
		l.boolp(null, 'x', false).should.equal(false);
	});
});

