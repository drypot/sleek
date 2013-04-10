var fs = require('fs');
var path = require('path');

var fs2 = require('./fs');

module.exports = function (opt) {

	var exports = {};

	var config = opt.config;

	var publicDir = config.uploadDir + '/public';
	var tmpDir = config.uploadDir + '/tmp';

	console.log('upload: ' + config.uploadDir);

	fs2.mkdirs([config.uploadDir, 'public', 'post']);
	fs2.mkdirs([config.uploadDir, 'tmp']);

	fs.readdirSync(tmpDir).forEach(function (filename) {
		fs.unlinkSync(tmpDir + '/' + filename);
	});

	// Tmp File

	exports.tmpFileExists = function (filename) {
		return fs.existsSync(tmpDir + '/' + filename);
	};

	exports.tmpFiles = function (files) {
		var tmpFiles = {};
		if (files) {
			(Array.isArray(files) ? files : [files]).forEach(function (file) {
				if (file.size) {
					tmpFiles[file.name] = path.basename(file.path);
				}
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
		return config.uploadUrl + '/post/' + Math.floor(postId / 10000) + '/' + postId + '/' + encodeURIComponent(upload);
	}

	exports.postFileExists = function (postId, basename) {
		return fs.existsSync(exports.postFileDir(postId) + '/' + basename);
	};

	exports.savePostFiles = function (postId, tmpFiles, next) {
		if (!tmpFiles || tmpFiles.length == 0) {
			return next();
		}
		saveTmpFiles([publicDir, 'post', Math.floor(postId / 10000), postId], tmpFiles, next);
	};

	function saveTmpFiles(subs, tmpFiles, next) {
		try {
			var tarDir = fs2.mkdirs(subs);
			var saved = [];
			for (var orgName in tmpFiles) {
				var safeName = fs2.safeFilename(path.basename(orgName));
				var tmpName = path.basename(tmpFiles[orgName]);
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

	exports.deletePostFiles = function (postId, delFiles, next) {
		if (!delFiles || delFiles.length == 0) {
			return next();
		}
		deleteFiles(exports.postFileDir(postId), delFiles, next);
	};

	function deleteFiles(dir, delFiles, next) {
		try {
			var deleted = [];
			delFiles.forEach(function (file) {
				var name = path.basename(file)
				var p = dir + '/' + name;
				//console.log('deleting: ' + path);
				try {
					fs.unlinkSync(p);
				} catch (err) {
					if (err.code !== 'ENOENT') throw err;
				}
				deleted.push(name);
			});
			next(err, deleted);
		} catch (err) {
			next(err);
		}
	}

	return exports;
};
