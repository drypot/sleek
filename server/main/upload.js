var fs = require('fs');
var path = require('path');

var fs2 = require('./fs');

module.exports = function (opt) {

	var config = opt.config;

	var publicDir = config.uploadDir + '/public';
	var tmpDir = config.uploadDir + '/tmp';

	console.log('upload directory: ' + config.uploadDir);

	fs2.mkdirs([config.uploadDir, 'public', 'post']);
	fs2.mkdirs([config.uploadDir, 'tmp']);

	fs.readdirSync(tmpDir).forEach(function (filename) {
		fs.unlink(tmpDir + '/' + filename);
	});

	// Tmp File

	exports.tmpExists = function (filename) {
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

	// Post File

	exports.postUploadDir = function (postId) {
		return publicDir + '/post/' + Math.floor(postId / 10000) + '/' + postId
	};

	exports.postUploadUrl = function (postId, upload) {
		return config.uploadUrl + '/post/' + Math.floor(postId / 10000) + '/' + postId + '/' + encodeURIComponent(upload);
	}

	exports.postUploadExists = function (postId, basename) {
		return fs.existsSync(exports.postUploadDir(postId) + '/' + basename);
	};

	exports.savePostUploadTmp = function (post, tmpFiles, next) {
		if (!tmpFiles || tmpFiles.length == 0) {
			next();
		} else {
			saveUploadTmp([publicDir, 'post', Math.floor(post._id / 10000), post._id], tmpFiles, function (err, saved) {
				if (err) {
					next(err);
				} else {
					if (saved) {
						if (post.upload) {
							saved.forEach(function (saved) {
								if (post.upload.indexOf(saved) == -1) {
									post.upload.push(saved);
								}
							});
						} else {
							post.upload = saved;
						}
					}
					next();
				}
			});
		}
	};

	exports.deletePostUpload = function (post, delFiles, next) {
		if (!delFiles || delFiles.length == 0) {
			next();
		} else {
			deleteUploads(exports.postUploadDir(post._id), delFiles, function (err, deleted) {
				if (err) {
					next(err);
				} else {
					if (deleted && post.upload) {
						post.upload = post.upload.filter(function (file) {
							return deleted.indexOf(file) == -1;
						});
						if (post.upload.length == 0) delete post.upload;
					}
					next();
				}
			});
		}
	};

	// Common

	function saveUploadTmp(subs, tmp, next /* (err, saved) */) {
		fs2.mkdirs(subs, function (err, tar) {
			if (err) {
				next(err);
			} else {
				var saved = [];
				async.forEachSeries(
					Object.keys(tmp),
					function (name, next) {
						var safeName = fs2.safeFilename(path.basename(name));
						var tmpName = path.basename(tmp[name]);
						fs.rename(tmpDir + '/' + tmpName, tar + '/' + safeName, function (err) {
							if (err && err.code !== 'ENOENT') {
								next(err);
							} else {
								saved.push(safeName);
								next();
							}
						});
					},
					function (err) {
						next(err, saved);
					}
				);
			}
		});
	}

	function deleteUploads(dir, delFiles, next /* (err, deleted) */) {
		var deleted = [];
		async.forEachSeries(
			delFiles,
			function (delFiles, next) {
				var name = path.basename(delFiles)
				var p = dir + '/' + name;
				//console.log('deleting: ' + path);
				deleted.push(name);
				fs.unlink(p, function (err) {
					if (err && err.code !== 'ENOENT') {
						next(err);
					} else {
						next();
					}
				});
			},
			function (err) {
				next(err, deleted);
			}
		);
	}

};
