var fs = require('fs');
var async = require('async');
var l = require('./l.js');

l.fs = {};

l.init.add(function () {

	l.fs.mkdirs = function (sub, next) {
		var dir;
		async.forEachSeries(sub, function (sub, next) {
			if (!dir) {
				dir = sub;
			} else {
				dir += '/' + sub;
			}
			fs.mkdir(dir, 0755, function (err) {
				if (err && err.code !== 'EEXIST') return next(err);
				next();
			});
		}, function (err) {
			next(err, dir);
		});
	};

	l.fs.safeFilename = function (name) {
		var i = 0;
		var len = name.length;
		var r = [];
		for (; i < len; i++) {
			var ch = name.charAt(i);
			var code = name.charCodeAt(i);
			if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || "`~!@#$%^&()-_+=[{]};',. ".indexOf(ch) >= 0)
				r.push(ch);
			else if (code < 128)
				r.push('_');
			else
				r.push(ch);
		}
		return r.join('');
	};

});
