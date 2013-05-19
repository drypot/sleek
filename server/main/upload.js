var fs = require('fs');
var path = require('path');

var init = require('../main/init');
var config = require('../main/config');
var fs2 = require('../main/fs');

init.add(function (next) {

	console.log('upload: ' + config.data.uploadDir);

	exports.getTmpFiles = function (_files) {
		var files = [];
		if (_files) {
			if (!Array.isArray(_files)) {
				pushFile(files, _files);
			} else {
				for (var i = 0; i < _files.length; i++) {
					pushFile(files, _files[i]);
				}
			}
		}
		return files;
	};

	function pushFile(files, file) {
		if (/*file.size &&*/ file.name) {
			files.push({
				orgName: file.name,
				tmpName: path.basename(file.path)
			});
		}
	}

	exports.deleteTmpFiles = function (files, next) {
		if (files) {
			var i = 0;
			function del() {
				if (i == files.length) return next();
				var file = files[i++];
				fs.unlink(exports.tmp + '/' + path.basename(file.tmpName), function (err) {
					if (err && err.code !== 'ENOENT') return next(err);
					setImmediate(del);
				});
			}
			del();
		}
	}

	var pathes = [
		exports.tmp = config.data.uploadDir + '/tmp',
		exports.pub = config.data.uploadDir + '/public',
		exports.pubPost = config.data.uploadDir + '/public/post'
	];

	var i = 0;
	function mkdir() {
		if (i == pathes.length) {
			fs2.emptyDir(exports.tmp, next);
			return;
		}
		var p = pathes[i++];
		fs2.makeDirs(p, function (err) {
			if (err) return next(err);
			setImmediate(mkdir);
		})
	}
	mkdir();

});
