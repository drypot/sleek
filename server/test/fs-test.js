var _ = require('underscore');
var should = require('should');
var fs = require('fs');
var fs2 = require('../main/fs.js');

var base = 'tmp';

describe('mkdirs', function () {
	before(function (next) {
		fs.rmdir(base + '/sub1/sub2', function (err) {
			should(!err || err.code === 'ENOENT');
			next();
		});
	});
	before(function (next) {
		fs.rmdir(base + '/sub1',  function (err) {
			should(!err || err.code === 'ENOENT');
			next();
		});
	});
	before(function (next) {
		fs.exists(base + '/sub1' + '/sub2', function (exists) {
			exists.should.be.false;
			next();
		});
	});
	it('can make sub1', function (next) {
		fs2.mkdirs([base, 'sub1'], function (err) {
			fs.exists(base + '/sub1', function (exists) {
				exists.should.be.true;
				next();
			});
		});
	});
	it('can make sub2', function (next) {
		fs2.mkdirs([base, 'sub1', 'sub2'], function (err, dir) {
			dir.should.equal(base + '/sub1/sub2');
			fs.exists(dir, function (exists) {
				exists.should.be.true;
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
		table.forEach(function (pair) {
			var a = fs2.safeFilename(pair[0]);
			var b = pair[1];
			if (a !== b) console.log(pair);
			should(a === b);
		})
	});
});