var _ = require('underscore');
var async = require('async');
var util = require('util');

var l = require('./l.js');
var config = require('./config.js');
var mongo = require('./mongo.js');
var es = require('./es.js');

var threadCursor, postCursor;

exports.rebuild = function (next) {
	threadCursor = mongo.threadCol.find();
	walkThread(next);
}

function walkThread(next) {
	threadCursor.nextObject(function (err, thread) {
		if (err) return next(err);
		if (!thread) return next();
		postCursor = mongo.postCol.find({ threadId: thread._id });
		walkPost(thread, function (err) {
			if (err) return next(err);
			walkThread(next);
		});
	});
}

function walkPost(thread, next) {
	postCursor.nextObject(function (err, post) {
		if (err) return next(err);
		if (!post) return next();
		updateSearchIndex(thread, post, function (err) {
			if (err) return next(err);
			walkPost(thread, next);
		});
	});
}

var count = 0;

function updateSearchIndex(thread, post, next) {
	count++;
	if (count % 1000 === 0) {
		process.stdout.write(count + ' ');
	}
	es.updatePost(thread, post, function (err) {});
	// node core 의 request socket 을 재사용하기 위해
	// callback 을 기다리지 않고 새로운 request 를 계속 밀어 넣는다.
	next();
}

if (module === require.main) {
	if (process.argv.length < 3) {
		console.log('specify configuration file path.');
		process.exit();
	}
	config.configPath = process.argv[2];

	l.runInit(function () {
		async.series([
			function (next) {
				es.dropIndex(next);
			},
			function (next) {
				l.c('start search index rebuilding.');
				exports.rebuild(next);
			},
			function (next) {
				mongo.db.close(next);
			},
			function (next) {
				l.c('completed.');
				next();
			}
		]);
	});
}