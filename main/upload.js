var _ = require('underscore');
var async = require('async');
var fs = require('fs');
var path = require('path');
var l = require('./l.js');

require('./config.js');
require('./fs.js');

l.upload = {};

l.init.init(function (next) {

	async.series([
		function (next) {
			l.fs.mkdirs([l.config.uploadTmpDir], next);
		},
		function (next) {
			l.fs.mkdirs([l.config.uploadDir, 'post'], next);
		},
		function (next) {
			l.log('upload directory: ' + l.config.uploadDir);
			l.log('upload tmp directory: ' + l.config.uploadTmpDir);
			fs.readdir(l.config.uploadTmpDir, function (err, file) {
				_.each(file, function (file) {
					fs.unlink(l.config.uploadTmpDir + '/' + file);
				});
				next();
			});
		},
	], next);

	// Tmp File

	l.upload.existsTmp = function (basename) {
		return fs.existsSync(l.config.uploadTmpDir + '/' + basename);
	};

	l.upload.getTmp = function (uploading) {
		var tmp = [];
		if (!_.isEmpty(uploading)) {
			_.each(_.isArray(uploading) ? uploading : [uploading], function (uploading) {
				if (uploading.size) {
					tmp.push({ org: uploading.name, tmp: path.basename(uploading.path)});
				}
			});
		}
		return tmp;
	};

	// Post File

	l.upload.getPostFileDir = function (postId) {
		return l.config.uploadDir + '/post/' + Math.floor(postId / 10000) + '/' + postId
	};

	l.upload.postFileExists = function (postId, basename) {
		return fs.existsSync(l.upload.getPostFileDir(postId) + '/' + basename);
	};

	l.upload.savePostFile = function (post, tmp, next) {
		if (_.isEmpty(tmp)) {
			next();
		} else {
			saveFile([l.config.uploadDir, 'post', Math.floor(post._id / 10000), post._id], tmp, function (err, saved) {
				if (err) {
					next(err);
				} else {
					if (saved) {
						post.file = !post.file ? saved : _.union(post.file, saved);
					}
					next();
				}
			});
		}
	};

	l.upload.deletePostFile = function (post, deleting, next) {
		if (_.isEmpty(deleting)) {
			next();
		} else {
			deleteFile(l.upload.getPostFileDir(post._id), deleting, function (err, deleted) {
				if (err) {
					next(err);
				} else {
					if (deleted) {
						post.file = _.without(post.file, deleted);
						if (post.file.length == 0) delete post.file;
					}
					next();
				}
			});
		}
	};

	// Common

	function saveFile(sub, tmp, next /* (err, saved) */) {
		l.fs.mkdirs(sub, function (err, tar) {
			if (err) {
				next(err);
			} else {
				var saved = [];
				async.forEachSeries(
					tmp,
					function (tmp, next) {
						var org = l.fs.safeFilename(path.basename(tmp.org));
						fs.rename(l.config.uploadTmpDir + '/' + tmp.tmp, tar + '/' + org, function (err) {
							if (err && err.code !== 'ENOENT') {
								next(err);
							} else {
								saved.push(org);
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

	function deleteFile(dir, deleting, next /* (err, deleted) */) {
		var deleted = [];
		async.forEachSeries(
			deleting,
			function (deleting, next) {
				var basename = path.basename(deleting)
				var p = dir + '/' + basename;
				//l.log('deleting: ' + path);
				deleted.push(basename);
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
