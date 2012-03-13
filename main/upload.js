var _ = require('underscore');
var should = require('should');
var async = require('async');
var fs = require('fs');
var path = require('path');

var l = require('./l.js');
var config = require('./config.js');

l.addInit(function (next) {
	async.series([
		function (next) {
			l.mkdirs(config.uploadDir, 'tmp', next);
		},
		function (next) {
			l.mkdirs(config.uploadDir, 'post', next);
		}
	], next);
});

var getPostDir = exports.getPostDir = function (post) {
	return config.uploadDir + '/post/' + Math.floor(post._id / 10000) + '/' + post._id
}

exports.savePostFile = function (post, file, next /* (err, saved) */) {
	if (!file) return next();
	l.mkdirs(config.uploadDir, 'post', Math.floor(post._id / 10000), post._id, function (err, dir) {
		if (err) return next(err);
		saveFile(dir, file, next);
	});
}

var saveFile = function (dir, file, next /* (err, saved) */) {
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
}

exports.deletePostFile = function (post, delFile, next /* (err, deleted) */) {
	if (!delFile) return next();
	deleteFile(getPostDir(post), delFile, next);
}

var deleteFile = function (dir, delFile, next /* (err, deleted) */) {
	var deleted = [];
	async.forEachSeries(
		delFile,
		function (delFile, next) {
			var basename = path.basename(delFile)
			var path = dir + '/' + basename;
			//console.log('deleting: ' + path);
			deleted.push(basename);
			fs.unlink(path, function (err) {
				if (err && err.code !== 'ENOENT') return next(err);
				next();
			});
		},
		function (err) {
			next(err, deleted);
		}
	);
}
