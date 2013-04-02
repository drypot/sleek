var fs = require('fs');
var async = require('async');


exports.mkdirs = function (subs, next) {
	var dir;
	async.forEachSeries(subs, function (sub, next) {
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

exports.safeFilename = function (name) {
	var i = 0;
	var len = name.length;
	var safe = '';
	for (; i < len; i++) {
		var ch = name.charAt(i);
		var code = name.charCodeAt(i);
		if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || "`~!@#$%^&()-_+=[{]};',. ".indexOf(ch) >= 0)
			safe += ch;
		else if (code < 128)
			safe += '_';
		else
			safe += ch;
	}
	return safe;
};
