var _ = require('underscore');
var _should = require('should');

var _lang = require('../main/lang');

_lang.addInit(function (callback) {
	console.log('first init');
	callback();
});

_lang.addInit(function (callback) {
	console.log('second init');
	callback();
});

before(function () {
	_lang.runInit(function () {
		console.log('after init');
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
		var tar = _lang.merge({}, src, ['f1', 'f2', 'f3']);
		tar.should.ok;
		tar.should.have.keys(['f1', 'f2', 'f3']);
		tar.f2.should.equal(2);
		_should.equal(undefined, tar.f3);
	})
})