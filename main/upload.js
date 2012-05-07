var _ = require('underscore');
var async = require('async');
var fs = require('fs');
var path = require('path');

var l = require('./l.js');
var config = require('./config.js');

l.addInit(function (next) {
	l.mkdirs([config.uploadTmpDir], next);
});

l.addInit(function (next) {
	l.mkdirs([config.uploadDir, 'post'], next);
});

l.addInit(function (next) {
	console.log('upload directory: ' + config.uploadDir);
	console.log('upload tmp directory: ' + config.uploadTmpDir);
	fs.readdir(config.uploadTmpDir, function (err, file) {
		_.each(file, function (file) {
			fs.unlink(config.uploadTmpDir + '/' + file);
		});
		next();
	});
});

// Tmp File

exports.tmpFileExists = function(basename) {
	return path.existsSync(config.uploadTmpDir + '/' + basename);
}

exports.keepTmpFile = function(upload, next) {
	if (_.isEmpty(upload)) return next(null, []);
	var saved = [];
	_.each(_.isArray(upload) ? upload : [upload], function (upload) {
		if (!upload.size) return;
		saved.push({ org: upload.name, tmp: path.basename(upload.path)});
	});
	next(null, saved);
};

// Post File

exports.getPostFileDir = function (postId) {
	return config.uploadDir + '/post/' + Math.floor(postId / 10000) + '/' + postId
};

exports.postFileExists = function(postId, basename) {
	return path.existsSync(exports.getPostFileDir(postId) + '/' + basename);
};

exports.savePostFile = function (post, tmp, next) {
	if (_.isEmpty(tmp)) return next();
	saveFile([config.uploadDir, 'post', Math.floor(post._id / 10000), post._id], tmp, function (err, saved) {
		if (err) return next(err);
		if (saved) {
			post.file = !post.file ? saved : _.union(post.file, saved);
		}
		next();
	});
};

exports.deletePostFile = function (post, fileToDel, next) {
	if (_.isEmpty(fileToDel)) return next();
	deleteFile(exports.getPostFileDir(post._id), fileToDel, function (err, deleted) {
		if (err) return next(err);
		if (deleted) {
			post.file = _.without(post.file, deleted);
			if (post.file.length == 0) delete post.file;
		}
		next();
	});
};

// Common

function saveFile (sub, tmp, next /* (err, saved) */) {
	l.mkdirs(sub, function (err, tar) {
		if (err) return next(err);
		var saved = [];
		async.forEachSeries(
			tmp,
			function (tmp, next) {
				var org = l.safeFilename(path.basename(tmp.org));
				fs.rename(config.uploadTmpDir + '/' + tmp.tmp, tar + '/' + org, function (err) {
					if (err && err.code !== 'ENOENT') {
						return next(err);
					}
					saved.push(org);
					next();
				});
			},
			function (err) {
				next(err, saved);
			}
		);
	});
}

function deleteFile (dir, fileToDel, next /* (err, deleted) */) {
	var deleted = [];
	async.forEachSeries(
		fileToDel,
		function (fileToDel, next) {
			var basename = path.basename(fileToDel)
			var p = dir + '/' + basename;
			//console.log('deleting: ' + path);
			deleted.push(basename);
			fs.unlink(p, function (err) {
				if (err && err.code !== 'ENOENT') {
					return next(err);
				}
				next();
			});
		},
		function (err) {
			next(err, deleted);
		}
	);
};
