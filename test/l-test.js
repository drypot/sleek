var _ = require('underscore');
var should = require('should');
var path = require('path');
var fs = require('fs');

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
			l.mkdirs([base, 'sub1'], function (err) {
				should(path.existsSync(base + '/sub1'));
				next();
			});
		});
		it('can make sub2', function (next) {
			l.mkdirs([base, 'sub1', 'sub2'], function (err, dir) {
				dir.should.equal(base + '/sub1/sub2');
				should(path.existsSync(dir));
				next();
			});
		});
	});
});

describe('safeFilename', function () {
	it('should success', function () {
		var table = [
			[ "`", "`" ], [ "~", "~" ],
			[ "!", "!" ], [ "@", "@" ], [ "#", "#" ], [ "$", "$" ],	[ "%", "%" ],
			[ "^", "^" ], [ "&", "&" ], [ "*", "_" ], [ "(", "(" ], [ ")", ")" ],
			[ "-", "-" ], [ "_", "_" ], [ "=", "=" ], [ "+", "+" ],
			[ "[", "[" ], [ "[", "[" ], [ "]", "]" ], [ "]", "]" ], [ "\\", "_" ], [ "|", "_" ],
			[ ";", ";" ], [ ":", "_" ], [ "'", "'" ], [ "\"", "_" ],
			[ ",", "," ], [ "<", "_" ], [ ".", "." ], [ ">", "_" ], [ "/", "_" ], [ "?", "_" ],
			[ "aaa\tbbb", "aaa_bbb" ],
			[ "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ 1234567890", "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ 1234567890" ],
			[ "이상한 '한글' 이름을 가진 파일", "이상한 '한글' 이름을 가진 파일" ]
		];
		_.each(table, function (pair) {
			var a = l.safeFilename(pair[0]);
			var b = pair[1];
			if (a !== b) l.log(pair);
			should(l.safeFilename(a) === b);
		})
	});
});