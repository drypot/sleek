var fs = require('fs');
var path = require('path');

var init = require('../main/init');
var config = require('../main/config');
var fs2 = require('../main/fs');

init.add(function (next) {

	console.log('upload: ' + config.data.uploadDir);

	exports.getFilenames = function (files) {
		var filenames = [];
		if (files) {
			if (!Array.isArray(files)) {
				pushName(filenames, files);
			} else {
				for (var i = 0; i < files.length; i++) {
					pushName(filenames, files[i]);
				}
			}
		}
		return filenames;
	};

	function pushName(filenames, file) {
		if (/*file.size &&*/ file.name) {
			filenames.push({
				orgName: file.name,
				tmpName: path.basename(file.path)
			});
		}
	}

	exports.deleteTmpFiles = function (fnames, next) {
		if (fnames) {
			var i = 0;
			function del() {
				if (i == fnames.length) return next();
				var fname = fnames[i++];
				fs.unlink(exports.tmp + '/' + path.basename(fname.tmpName), function (err) {
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
