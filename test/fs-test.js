var _ = require('underscore');
var should = require('should');
var fs = require('fs');
var l = require('../main/l.js');

require('../main/fs.js');

before(function (next) {
	l.init.run(next);
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
			should(fs.existsSync(base));
		});
		it("confirms sub not exists", function () {
			should(!fs.existsSync(base + '/sub1' + '/sub2'));
		});
		it('can make sub1', function (next) {
			l.fs.mkdirs([base, 'sub1'], function (err) {
				should(fs.existsSync(base + '/sub1'));
				next();
			});
		});
		it('can make sub2', function (next) {
			l.fs.mkdirs([base, 'sub1', 'sub2'], function (err, dir) {
				dir.should.equal(base + '/sub1/sub2');
				should(fs.existsSync(dir));
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
			var a = l.fs.safeFilename(pair[0]);
			var b = pair[1];
			if (a !== b) l.log(pair);
			should(a === b);
		})
	});
});