var _ = require('underscore');
var should = require('should');
var l = require('../main/l.js');

before(function (next) {
	l.init.run(next);
});

describe('property', function () {

	describe('def', function () {
		it('should success', function () {
			l.def({x: 'def'}, 'x', 'abc').should.equal('def');
			l.def({y: 'def'}, 'x', 'abc').should.equal('abc');
			l.def(null, 'x', 'abc').should.equal('abc');
		});
	});

	describe('defInt', function () {
		it('should success', function () {
			l.defInt({x: '10'}, 'x', 30).should.equal(10);
			l.defInt({x: 10}, 'x', 30).should.equal(10);
			l.defInt({x: 'def'}, 'x', 30).should.equal(30);
			l.defInt({y: '10'}, 'x', 30).should.equal(30);
			l.defInt(null, 'x', 30).should.equal(30);
		});

		it('when min, max given, should success', function () {
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
		it('should success', function () {
			l.defString({x: 'def'}, 'x', 'abc').should.equal('def');
			l.defString({x: 10}, 'x', 'abc').should.equal('10');
			l.defString({x: ' def '}, 'x', 'abc').should.equal('def');
			l.defString({y: 'def'}, 'x', 'abc').should.equal('abc');
			l.defString(null, 'x', 'abc').should.equal('abc');
		});
	});

	describe('defBool', function () {
		it('should success', function () {
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
		it('should success', function () {
			var tar = l.mergeProperty({}, src, ['f1', 'f2', 'f3']);
			tar.should.ok;
			tar.should.have.keys(['f1', 'f2', 'f3']);
			tar.f2.should.equal(2);
			should.equal(undefined, tar.f3);
		})
	});
});

describe('UrlMaker', function () {
	it('given baseUrl, should success', function () {
		var u = new l.UrlMaker('/thread');
		u.toString().should.equal('/thread');
	});
	it('given query param, should success', function () {
		var u = new l.UrlMaker('/thread');
		u.add('p', 10);
		u.toString().should.equal('/thread?p=10');
	});
	it('given two query params, should success', function () {
		var u = new l.UrlMaker('/thread');
		u.add('p', 10);
		u.add('ps', 16);
		u.toString().should.equal('/thread?p=10&ps=16');
	});
	it('given chained expression, should success', function () {
		new l.UrlMaker('/thread').add('p', 10).add('ps', 16).toString().should.equal('/thread?p=10&ps=16');
	});
	it('given default value, should success', function () {
		var u = new l.UrlMaker('/thread');
		var p = 0;
		var ps = 16;
		u.addIfNot('p', p, 0);
		u.addIfNot('ps', ps, 32);
		u.toString().should.equal('/thread?ps=16');
	});
});
