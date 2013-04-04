var _ = require('underscore');
var async = require('async');
var fs = require('fs');
var path = require('path');
var l = require('./l');

require('./config');
require('./fs');

l.upload = {};

l.init(function (next) {

	var publicDir = l.config.uploadDir + '/public';
	var tmpDir = l.config.uploadDir + '/tmp';

	async.series([
		function (next) {
			l.fs.mkdirs([l.config.uploadDir, 'public', 'post'], next);
		},
		function (next) {
			l.fs.mkdirs([l.config.uploadDir, 'tmp'], next);
		},
		function (next) {
			console.log('upload directory: ' + l.config.uploadDir);
			fs.readdir(tmpDir, function (err, tmp) {
				_.each(tmp, function (tmp) {
					fs.unlink(tmpDir + '/' + tmp);
				});
				next();
			});
		},
	], next);

	// Tmp File

	l.upload.tmpExists = function (basename) {
		return fs.existsSync(tmpDir + '/' + basename);
	};

	l.upload.uploadTmp = function (uploading) {
		var uploadTmp = {};
		if (!_.isEmpty(uploading)) {
			_.each(_.isArray(uploading) ? uploading : [uploading], function (uploading) {
				if (uploading.size) {
					uploadTmp[uploading.name] = path.basename(uploading.path);
				}
			});
		}
		return uploadTmp;
	};

	// Post File

	l.upload.postUploadDir = function (postId) {
		return publicDir + '/post/' + Math.floor(postId / 10000) + '/' + postId
	};

	l.upload.postUploadUrl = function (postId, upload) {
		return l.config.uploadUrl + '/post/' + Math.floor(postId / 10000) + '/' + postId + '/' + encodeURIComponent(upload);
	}

	l.upload.postUploadExists = function (postId, basename) {
		return fs.existsSync(l.upload.postUploadDir(postId) + '/' + basename);
	};

	l.upload.savePostUploadTmp = function (post, uploadTmp, next) {
		if (_.isEmpty(uploadTmp)) {
			next();
		} else {
			saveUploadTmp([publicDir, 'post', Math.floor(post._id / 10000), post._id], uploadTmp, function (err, saved) {
				if (err) {
					next(err);
				} else {
					if (saved) {
						post.upload = !post.upload ? saved : _.union(post.upload, saved);
					}
					next();
				}
			});
		}
	};

	l.upload.deletePostUpload = function (post, deleting, next) {
		if (_.isEmpty(deleting)) {
			next();
		} else {
			deleteUploads(l.upload.postUploadDir(post._id), deleting, function (err, deleted) {
				if (err) {
					next(err);
				} else {
					if (deleted) {
						post.upload = _.without(post.upload, deleted);
						if (post.upload.length == 0) delete post.upload;
					}
					next();
				}
			});
		}
	};

	// Common

	function saveUploadTmp(subs, tmp, next /* (err, saved) */) {
		l.fs.mkdirs(subs, function (err, tar) {
			if (err) {
				next(err);
			} else {
				var saved = [];
				async.forEachSeries(
					_.keys(tmp),
					function (name, next) {
						var safeName = l.fs.safeFilename(path.basename(name));
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

	function deleteUploads(dir, deleting, next /* (err, deleted) */) {
		var deleted = [];
		async.forEachSeries(
			deleting,
			function (deleting, next) {
				var name = path.basename(deleting)
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

});
