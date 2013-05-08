var fs = require('fs');
var path = require('path');

var init = require('../main/init');
var config = require('../main/config');
var fs2 = require('../main/fs');

init.add(function (next) {

	exports.tmpFileExists = function (filename) {
		return fs.existsSync(exports.tmp + '/' + filename);
	};

	exports.tmpFiles = function (files) {
		var tmpFiles = [];
		if (files) {
			if (!Array.isArray(files)) {
				files = [files];
			}
			files.forEach(function (file) {
				// 정상 업로드 size 가 0 으로 보고되는 경우 발견
				//if (file.size) {
					tmpFiles.push({
						name: file.name,
						tmpName: path.basename(file.path)
					});
				//}
			});
		}
		return tmpFiles;
	};

	exports.deleteTmpFiles = function (files) {
		if (files) {
			files.forEach(function (file) {
				var tmpName = path.basename(file.tmpName);
				try {
					fs.unlinkSync(exports.tmp + '/' + tmpName);
				} catch (err) {
					if (err.code !== 'ENOENT') throw err;
				}
			});
		}
	}

	// Post File

	exports.postFileDir = function (pid) {
		return exports.pub + '/post/' + Math.floor(pid / 10000) + '/' + pid
	};

	exports.postFileUrl = function (pid, fname) {
		return config.data.uploadUrl + '/post/' + Math.floor(pid / 10000) + '/' + pid + '/' + encodeURIComponent(fname);
	}

	exports.postFileExists = function (pid, filename) {
		return fs.existsSync(exports.postFileDir(pid) + '/' + filename);
	};

	exports.savePostFiles = function (pid, files, next) {
		if (!files || files.length == 0) {
			return next();
		}
		saveTmpFiles(files, [exports.pubPost, Math.floor(pid / 10000), pid], next);
	};

	function saveTmpFiles(files, subs, next) {
		fs2.mkdirs(subs, function (err, tarDir) {
			if (err) return next(err);
			var saved = [];
			var i = 0;
			function save() {
				if (i == files.length) {
					return next(null, saved);
				}
				var file = files[i++];
				var safeName = fs2.safeFilename(path.basename(file.name));
				var tmpName = path.basename(file.tmpName);
				fs.rename(exports.tmp + '/' + tmpName, tarDir + '/' + safeName, function (err) {
					if (err && err.code !== 'ENOENT') return next(err);
					saved.push({ name: safeName });
					setImmediate(save);
				});
			}
			save();
		});
	}

	exports.deletePostFiles = function (pid, files, next) {
		if (!files || files.length == 0) {
			return next();
		}
		deleteFiles(files, exports.postFileDir(pid), next);
	};

	function deleteFiles(files, dir, next) {
		var deleted = [];
		var i = 0;
		function del() {
			if (i == files.length) {
				return next(null, deleted);
			}
			var file = files[i++];
			var name = path.basename(file)
			var p = dir + '/' + name;
			fs.unlink(p, function (err) {
				if (err && err.code !== 'ENOENT') return next(err);
				deleted.push(name);
				setImmediate(del);
			});
		}
		del();
	}


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
