var _ = require('underscore');
var async = require('async');
var fs = require('fs');
var path = require('path');

var l = require('./l.js');
var config = require('./config.js');

var tmpFileDir;
var postFileDir;

l.addInit(function (next) {
	exports.tmpFileDir = tmpFileDir = config.uploadDir + '/tmp';
	l.mkdirs([config.uploadDir, 'tmp'], next);
});

l.addInit(function (next) {
	postFileDir = config.uploadDir + '/post'
	l.mkdirs([config.uploadDir, 'post'], next);
});

l.addInit(function (next) {
	console.log('upload tmp directory: ' + tmpFileDir);
	fs.readdir(tmpFileDir, function (err, file) {
		_.each(file, function (file) {
			fs.unlink(tmpFileDir + '/' + file);
		});
		next();
	});
});

// Tmp File

exports.tmpFileExists = function(basename) {
	return path.existsSync(tmpFileDir + '/' + basename);
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
	return postFileDir + '/' + Math.floor(postId / 10000) + '/' + postId
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

exports.deletePostFile = function (post, delFile, next) {
	if (_.isEmpty(delFile)) return next();
	deleteFile(exports.getPostFileDir(post._id), delFile, function (err, deleted) {
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
				fs.rename(tmpFileDir + '/' + tmp.tmp, tar + '/' + org, function (err) {
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

function deleteFile (dir, delFile, next /* (err, deleted) */) {
	var deleted = [];
	async.forEachSeries(
		delFile,
		function (delFile, next) {
			var basename = path.basename(delFile)
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
