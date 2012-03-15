var _ = require('underscore');
var should = require('should');
var async = require('async');
var fs = require('fs');
var path = require('path');

var l = require('./l.js');
var config = require('./config.js');

l.init.add(function (next) {
	l.fs.mkdirs([config.uploadDir, 'tmp'], next);
});

exports.saveFile = function (sub, file, next /* (err, saved) */) {
	l.fs.mkdirs(sub, function (err, dir) {
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

exports.deleteFile = function (dir, delFile, next /* (err, deleted) */) {
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
}
