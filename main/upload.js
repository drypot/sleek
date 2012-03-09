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

exports.savePostFile = function (post, file, next /* (err, fileName) */) {
	if (!file) return next();
	_lang.mkdirs(_config.uploadDir, 'post', Math.floor(post._id / 10000), post._id, function (err, dir) {
		if (err) return next(err);
		saveFile(dir, file, next);
	});
}

function saveFile(dir, file, next /* (err, fileName) */) {
	if (!_.isArray(file)) file = [file];
	_async.mapSeries(
		file,
		function (file, next) {
			if (!file.size) next();
			_fs.rename(file.path, dir + '/' + file.name, function (err) {
				next(err, file.name);
			});
		},
		next
	);
}

exports.deletePostFile = function (post, delFile, next /* (err, fileNames) */) {
	deleteFile(_config.uploadDir + '/post/' + Math.floor(post._id / 10000) + '/' + post._id, delFile, next);
}

function deleteFile(dir, delFile, next /* (err, fileNames) */) {
	_async.mapSeries(
		delFile,
		function (file, next) {
			var basename = _path.basename(file)
			var path = dir + '/' + basename;
			//console.log('deleting: ' + path);
			_fs.unlink(path, function (err) {
				next(err, basename);
			});
		},
		next
	);
}
