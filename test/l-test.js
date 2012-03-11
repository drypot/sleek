var _ = require('underscore');
var _should = require('should');

var _l = require('../main/l');

describe('initList', function () {
	var a = [];
	before(function () {
		_l.addInit(function (next) {
			a.push(2);
			next();
		});
		_l.addAfterInit(function (next) {
			a.push(3);
			next();
		});
		_l.addBeforeInit(function (next) {
			a.push(1);
			next();
		});
		_l.runInit();
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
		var tar = _l.merge({}, src, ['f1', 'f2', 'f3']);
		tar.should.ok;
		tar.should.have.keys(['f1', 'f2', 'f3']);
		tar.f2.should.equal(2);
		_should.equal(undefined, tar.f3);
	})
});

describe('p', function () {
	it('should return value', function () {
		_l.p({x: 'def'}, 'x', 'abc').should.equal('def');
	});
	it('should return default for non existing property', function () {
		_l.p({y: 'def'}, 'x', 'abc').should.equal('abc');
	});
	it('should return default for null obj', function () {
		_l.p(null, 'x', 'abc').should.equal('abc');
	});
});

describe('intp', function () {
	it('should return value', function () {
		_l.intp({x: '10'}, 'x', 30).should.equal(10);
	});
	it('should return value', function () {
		_l.intp({x: 10}, 'x', 30).should.equal(10);
	});
	it('should return default for NaN', function () {
		_l.intp({x: 'def'}, 'x', 30).should.equal(30);
	});
	it('should return default for non existing property', function () {
		_l.intp({y: '10'}, 'x', 30).should.equal(30);
	});
	it('should return default for null obj', function () {
		_l.intp(null, 'x', 30).should.equal(30);
	});
});

describe('strp', function () {
	it('should return value', function () {
		_l.strp({x: 'def'}, 'x', 'abc').should.equal('def');
	});
	it('should return value casted as string', function () {
		_l.strp({x: 10}, 'x', 'abc').should.equal('10');
	});
	it('should return trimed value', function () {
		_l.strp({x: ' def '}, 'x', 'abc').should.equal('def');
	});
	it('should return default for non existing property', function () {
		_l.strp({y: 'def'}, 'x', 'abc').should.equal('abc');
	});
	it('should return default for null obj', function () {
		_l.strp(null, 'x', 'abc').should.equal('abc');
	});
});

describe('boolp', function () {
	it('should return value', function () {
		_l.boolp({x: 'true'}, 'x', true).should.equal(true);
	});
	it('should return value', function () {
		_l.boolp({x: true}, 'x', true).should.equal(true);
	});
	it('should return value', function () {
		_l.boolp({x: 'false'}, 'x', true).should.equal(false);
	});
	it('should return value', function () {
		_l.boolp({x: false}, 'x', true).should.equal(false);
	});
	it('should return default for non existing property', function () {
		_l.boolp({y: true}, 'x', true).should.equal(true);
	});
	it('should return default for non existing property', function () {
		_l.boolp({y: true}, 'x', false).should.equal(false);
	});
	it('should return default for non existing property', function () {
		_l.boolp({y: false}, 'x', true).should.equal(true);
	});
	it('should return default for null obj', function () {
		_l.boolp(null, 'x', true).should.equal(true);
	});
	it('should return default for null obj', function () {
		_l.boolp(null, 'x', false).should.equal(false);
	});
});

