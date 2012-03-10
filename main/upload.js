var _ = require('underscore');
var _should = require('should');
var _async = require('async');
var _fs = require('fs');
var _path = require('path');

var _lang = require('./lang');
var _config = require('./config');

_lang.addInit(function (next) {
	_async.series([
		function (next) {
			_lang.mkdirs(_config.uploadDir, 'tmp', next);
		},
		function (next) {
			_lang.mkdirs(_config.uploadDir, 'post', next);
		}
	], next);
});

var getPostDir = exports.getPostDir = function (post) {
	return _config.uploadDir + '/post/' + Math.floor(post._id / 10000) + '/' + post._id
}

exports.savePostFile = function (post, file, next /* (err, saved) */) {
	if (!file) return next();
	_lang.mkdirs(_config.uploadDir, 'post', Math.floor(post._id / 10000), post._id, function (err, dir) {
		if (err) return next(err);
		saveFile(dir, file, next);
	});
}

var saveFile = function (dir, file, next /* (err, saved) */) {
	var saved = [];
	if (!_.isArray(file)) file = [file];
	_async.forEachSeries(
		file,
		function (file, next) {
			if (!file.size) return next();
			saved.push(file.name);
			if (file.__skip) return next();
			_fs.rename(file.path, dir + '/' + file.name, next);
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
	_async.forEachSeries(
		delFile,
		function (delFile, next) {
			var basename = _path.basename(delFile)
			var path = dir + '/' + basename;
			//console.log('deleting: ' + path);
			deleted.push(basename);
			_fs.unlink(path, function (err) {
				if (err && err.code !== 'ENOENT') return next(err);
				next();
			});
		},
		function (err) {
			next(err, deleted);
		}
	);
}
