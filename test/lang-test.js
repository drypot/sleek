var _ = require('underscore');
var _should = require('should');

var _lang = require('../main/lang');

describe('initList', function () {
	var a = [];
	before(function () {
		_lang.addInit(function (next) {
			a.push(2);
			next();
		});
		_lang.addAfterInit(function (next) {
			a.push(3);
			next();
		});
		_lang.addBeforeInit(function (next) {
			a.push(1);
			next();
		});
		_lang.runInit();
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
		var tar = _lang.merge({}, src, ['f1', 'f2', 'f3']);
		tar.should.ok;
		tar.should.have.keys(['f1', 'f2', 'f3']);
		tar.f2.should.equal(2);
		_should.equal(undefined, tar.f3);
	})
});

describe('p', function () {
	it('should return value', function () {
		_lang.p({x: 'def'}, 'x', 'abc').should.equal('def');
	});
	it('should return default for non existing property', function () {
		_lang.p({y: 'def'}, 'x', 'abc').should.equal('abc');
	});
	it('should return default for null obj', function () {
		_lang.p(null, 'x', 'abc').should.equal('abc');
	});
});

describe('intp', function () {
	it('should return value', function () {
		_lang.intp({x: '10'}, 'x', 30).should.equal(10);
	});
	it('should return value', function () {
		_lang.intp({x: 10}, 'x', 30).should.equal(10);
	});
	it('should return default for NaN', function () {
		_lang.intp({x: 'def'}, 'x', 30).should.equal(30);
	});
	it('should return default for non existing property', function () {
		_lang.intp({y: '10'}, 'x', 30).should.equal(30);
	});
	it('should return default for null obj', function () {
		_lang.intp(null, 'x', 30).should.equal(30);
	});
});

describe('strp', function () {
	it('should return value', function () {
		_lang.strp({x: 'def'}, 'x', 'abc').should.equal('def');
	});
	it('should return value casted as string', function () {
		_lang.strp({x: 10}, 'x', 'abc').should.equal('10');
	});
	it('should return trimed value', function () {
		_lang.strp({x: ' def '}, 'x', 'abc').should.equal('def');
	});
	it('should return default for non existing property', function () {
		_lang.strp({y: 'def'}, 'x', 'abc').should.equal('abc');
	});
	it('should return default for null obj', function () {
		_lang.strp(null, 'x', 'abc').should.equal('abc');
	});
});

describe('boolp', function () {
	it('should return value', function () {
		_lang.boolp({x: 'true'}, 'x', true).should.equal(true);
	});
	it('should return value', function () {
		_lang.boolp({x: true}, 'x', true).should.equal(true);
	});
	it('should return value', function () {
		_lang.boolp({x: 'false'}, 'x', true).should.equal(false);
	});
	it('should return value', function () {
		_lang.boolp({x: false}, 'x', true).should.equal(false);
	});
	it('should return default for non existing property', function () {
		_lang.boolp({y: true}, 'x', true).should.equal(true);
	});
	it('should return default for non existing property', function () {
		_lang.boolp({y: true}, 'x', false).should.equal(false);
	});
	it('should return default for non existing property', function () {
		_lang.boolp({y: false}, 'x', true).should.equal(true);
	});
	it('should return default for null obj', function () {
		_lang.boolp(null, 'x', true).should.equal(true);
	});
	it('should return default for null obj', function () {
		_lang.boolp(null, 'x', false).should.equal(false);
	});
});

