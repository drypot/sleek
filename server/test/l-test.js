var should = require('should');
var l = require('../main/l');

describe('normal init function', function () {
	it('should success', function (next) {
		var a = [];
		l.init.reset();
		l.init(function () {
			a.push(3);
		});
		l.init(function () {
			a.push(7);
		});
		l.init.run(function () {
			a.should.length(2);
			a[0].should.equal(3);
			a[1].should.equal(7);
			next();
		});
	});
});

describe('async init function', function () {
	it('should success', function (next) {
		var a = [];
		l.init.reset();
		l.init(function (next) {
			a.push(33);
			next();
		});
		l.init(function (next) {
			a.push(77);
			next();
		});
		l.init.run(function () {
			a.should.length(2);
			a[0].should.equal(33);
			a[1].should.equal(77);
			next();
		});
	});
});

//describe('value', function () {
//	it('should success', function () {
//		l.value({x: 'def'}, 'x', 'abc').should.equal('def');
//		l.value({y: 'def'}, 'x', 'abc').should.equal('abc');
//		l.value(null, 'x', 'abc').should.equal('abc');
//	});
//});
//
//describe('int', function () {
//	it('should success', function () {
//		l.int({x: '10'}, 'x', 30).should.equal(10);
//		l.int({x: 10}, 'x', 30).should.equal(10);
//		l.int({x: 'def'}, 'x', 30).should.equal(30);
//		l.int({y: '10'}, 'x', 30).should.equal(30);
//		l.int(null, 'x', 30).should.equal(30);
//	});
//
//	it('when min, max given, should success', function () {
//		l.int({x: '10'}, 'x', 30, 0, 50).should.equal(10);
//		l.int({x: 10}, 'x', 30, 0, 50).should.equal(10);
//		l.int({x: 'def'}, 'x', 30, 0, 50).should.equal(30);
//		l.int({y: '10'}, 'x', 30, 0, 50).should.equal(30);
//		l.int(null, 'x', 30, 0, 50).should.equal(30);
//		l.int({x: 60}, 'x', 30, 0, 50).should.equal(50);
//		l.int({x: -60}, 'x', 30, 0, 50).should.equal(0);
//	});
//});
//
//describe('string', function () {
//	it('should success', function () {
//		l.string({x: 'def'}, 'x', 'abc').should.equal('def');
//		l.string({x: 10}, 'x', 'abc').should.equal('10');
//		l.string({x: ' def '}, 'x', 'abc').should.equal('def');
//		l.string({y: 'def'}, 'x', 'abc').should.equal('abc');
//		l.string(null, 'x', 'abc').should.equal('abc');
//	});
//});
//
//describe('bool', function () {
//	it('should success', function () {
//		l.bool({x: 'true'}, 'x', true).should.equal(true);
//		l.bool({x: true}, 'x', true).should.equal(true);
//		l.bool({x: 'false'}, 'x', true).should.equal(false);
//		l.bool({x: false}, 'x', true).should.equal(false);
//		l.bool({y: true}, 'x', true).should.equal(true);
//		l.bool({y: true}, 'x', false).should.equal(false);
//		l.bool({y: false}, 'x', true).should.equal(true);
//		l.bool(null, 'x', true).should.equal(true);
//		l.bool(null, 'x', false).should.equal(false);
//	});
//});

describe('mergeProperty', function () {
	var src = {
		f1 : 1,
		f2 : 2,
		f3 : undefined,
		f4 : 4
	}
	it('should success', function () {
		var tar = l.merge({}, src, ['f1', 'f2', 'f3']);
		tar.should.ok;
		tar.should.have.keys(['f1', 'f2', 'f3']);
		tar.f2.should.equal(2);
		should.equal(undefined, tar.f3);
	})
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

describe('formatDate', function () {
	it('should success', function () {
		var d = new Date(1974, 4, 16, 12, 0);
		l.formatDateTime(d).should.equal('1974-05-16 12:00');
	})
});