var fs = require('fs');
var path = require('path');

var init = require('../main/init');
var config = require('../main/config');
var fs2 = require('../main/fs');

init.add(function (next) {

	var publicDir = config.data.uploadDir + '/public';
	var tmpDir = config.data.uploadDir + '/tmp';

	console.log('upload: ' + config.data.uploadDir);

	initExports();
	initDir(next);

	function initDir(next) {
		try {
			fs2.mkdirs([config.data.uploadDir, 'public', 'post']);
			fs2.mkdirs([config.data.uploadDir, 'tmp']);

			fs.readdirSync(tmpDir).forEach(function (filename) {
				fs.unlinkSync(tmpDir + '/' + filename);
			});
			next();
		} catch (err) {
			next(err);
		}
	}

	function initExports() {

		// Tmp File

		exports.tmpFileExists = function (filename) {
			return fs.existsSync(tmpDir + '/' + filename);
		};

		exports.tmpFiles = function (files) {
			var tmpFiles = {};
			if (files) {
				(Array.isArray(files) ? files : [files]).forEach(function (file) {
					// 정상 업로드 size 가 0 으로 보고되는 경우 발견
					//if (file.size) {
						tmpFiles[file.name] = path.basename(file.path);
					//}
				});
			}
			return tmpFiles;
		};

		exports.deleteTmpFiles = function (files) {
			if (files) {
				files.forEach(function (file) {
					var filename = path.basename(file);
					try {
						fs.unlinkSync(tmpDir + '/' + filename);
					} catch (err) {
						if (err.code !== 'ENOENT') throw err;
					}
				});
			}
		}

		// Post File

		exports.postFileDir = function (postId) {
			return publicDir + '/post/' + Math.floor(postId / 10000) + '/' + postId
		};

		exports.postFileUrl = function (postId, upload) {
			return config.data.uploadUrl + '/post/' + Math.floor(postId / 10000) + '/' + postId + '/' + encodeURIComponent(upload);
		}

		exports.postFileExists = function (postId, basename) {
			return fs.existsSync(exports.postFileDir(postId) + '/' + basename);
		};

		exports.savePostFiles = function (files, postId, next) {
			if (!files || files.length == 0) {
				return next();
			}
			saveTmpFiles(files, [publicDir, 'post', Math.floor(postId / 10000), postId], next);
		};

		function saveTmpFiles(files, subs, next) {
			try {
				var tarDir = fs2.mkdirs(subs);
				var saved = [];
				for (var orgName in files) {
					var safeName = fs2.safeFilename(path.basename(orgName));
					var tmpName = path.basename(files[orgName]);
					try {
						fs.renameSync(tmpDir + '/' + tmpName, tarDir + '/' + safeName);
					} catch (err) {
						if (err.code !== 'ENOENT') throw err;
					}
					saved.push(safeName);
				}
				next(null, saved);
			} catch (err) {
				next(err);
			}
		}

		exports.deletePostFiles = function (postId, files, next) {
			if (!files || files.length == 0) {
				return next();
			}
			deleteFiles(exports.postFileDir(postId), files, next);
		};

		function deleteFiles(dir, files, next) {
			try {
				var deleted = [];
				files.forEach(function (file) {
					var name = path.basename(file)
					var p = dir + '/' + name;
//					console.log('deleting: ' + p);
					try {
						fs.unlinkSync(p);
					} catch (err) {
						if (err.code !== 'ENOENT') throw err;
					}
					deleted.push(name);
				});
				next(null, deleted);
			} catch (err) {
				next(err);
			}
		}
	}

});
