var fs = require('fs');
var path = require('path');

var init = require('../main/init');
var config = require('../main/config');
var fs2 = require('../main/fs');

init.add(function (next) {

	console.log('upload: ' + config.data.uploadDir);

	var pathes = [
		exports.pub = config.data.uploadDir + '/public',
		exports.pubPost = config.data.uploadDir + '/public/post',
		exports.tmp = config.data.uploadDir + '/tmp'
	];

	var i = 0;
	function mkdir() {
		if (i == pathes.length) {
			fs2.emptyDir(exports.tmp, next);
			return;
		}
		var p = pathes[i++];
		fs2.mkdirs(p, function (err) {
			if (err) return next(err);
			setImmediate(mkdir);
		})
	}
	mkdir();

});
