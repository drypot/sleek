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

exports.tmpFileExists = function(basename) {
	return path.existsSync(tmpFileDir + '/' + basename);
}

exports.receiveFile = function(req, next) {
	var file = req.files && req.files.file;
	if (!file) {
		return next(null, []);
	}

	var saved = [];
	if (!_.isArray(file)) file = [file];
	async.forEachSeries(
		file,
		function (file, next) {
			if (!file.size) return next();
			var basename = path.basename(file.path);
			saved.push(basename);
			req.session.file[basename] = file.name;
			next();
		},
		function (err) {
			next(err, saved);
		}
	);
};

function saveFile (sub, file, next /* (err, saved) */) {
	l.mkdirs(sub, function (err, dir) {
		if (err) return next(err);
		var saved = [];
		if (!_.isArray(file)) file = [file];
		async.forEachSeries(
			file,
			function (file, next) {
				if (!file.size) return next();
				saved.push(file.name);
				if (file.__skip) return next();
				fs.rename(file.path, dir + '/' + file.name, next);
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
				if (err && err.code !== 'ENOENT') return next(err);
				next();
			});
		},
		function (err) {
			next(err, deleted);
		}
	);
};

// post

exports.getPostFileDir = function (post) {
	return postFileDir + '/' + Math.floor(post._id / 10000) + '/' + post._id
};

exports.postFileExists = function(post, basename) {
	return path.existsSync(exports.getPostFileDir(post) + '/' + basename);
};

exports.savePostFile = function (post, file, next) {
	if (!file) return next();
	saveFile([config.uploadDir, 'post', Math.floor(post._id / 10000), post._id], file, function (err, saved) {
		if (err) return next(err);
		if (saved) {
			post.file = !post.file ? saved : _.union(post.file, saved);
		}
		next();
	});
};

exports.deletePostFile = function (post, delFile, next) {
	if (!delFile) return next();
	deleteFile(exports.getPostFileDir(post), delFile, function (err, deleted) {
		if (err) return next(err);
		if (deleted) {
			post.file = _.without(post.file, deleted);
			if (post.file.length == 0) delete post.file;
		}
		next();
	});
};
