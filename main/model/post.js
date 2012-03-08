var _ = require('underscore');
var _should = require('should');
var _async = require('async');
var _fs = require('fs');

var _lang = require('../lang');
var _config = require("../config");
var _db = require('../db');

var col;
var idSeed;

_lang.addInit(function (next) {
	col = exports.col = _db.db.collection("post");
	col.ensureIndex({threadId: 1, cdate: 1});
	col.find({}, {_id: 1}).sort({_id: -1}).limit(1).next(function (err, obj) {
		if (err) return next(err);
		idSeed = obj ? obj._id : 0;
		console.info('post id seed: ' + idSeed);
		next();
	});
});

// Post

exports.make = function (obj) {
	return new Post(obj);
}

var Post = function (obj) {
//	int _id;
//	int threadId;
//	DateTime cdate;
//	boolean visible;
//	String userName;
//	String text;
//	List<String> fileNameList; file;
	_.extend(this, obj);
}

// _post.*

exports.setNewId = function (post) {
	post._id = ++idSeed;
}

exports.insert = function (post, file, next) {
	saveFile(post, file, function (err) {
		if (err) return next(err);
		col.insert(post);
		//searchService.newPost(thread, post);
		next();
	});
}

var saveFile = function (post, file, next) {
	function saveOne(file, next) {
		if (file.size) {
			_lang.mkdirs(_config.uploadDir, 'post', Math.floor(post._id / 10000), function (err, dir) {
				if (err) return next(err);
				_fs.rename(file.path, dir + '/' + file.name, function (err) {
					if (err) return next(err);
					if (!post.file) post.file = [];
					post.file.push(file.name);
					next();
				});
			});
		}
	}
	if (!file) {
		return next();
	}
	if (_.isArray(file)) {
		return _async.forEachSeries(file, saveOne, next);
	}
	saveOne(file, next);
}

//form._deleteFiles = function (next) {
//	console.log('delete postId: ' + post.postId);
//	console.log(_util.inspect(post.delFiles));
//	next();
//}


exports.update = function (post, file, delFiles, next) {
	col.save(post, next);
}

// 	_async.series([

//		function (next) {
//			post._deleteFiles(next);
//		},
//		function (next) {
//			post._saveFiles(next);
//		},

//		searchService.updatePost(thread, post);

//exports.removeFileName', function (name) {
//	if (post.fileNameList) {
//		post.fileNameList = _.without(post.fileNameList, name);
//		if (post.fileNameList.length == 0) {
//			delete post.fileNameList;
//		}
//	}
//});

exports.findById = function (id, next) {
	return col.findOne({_id: id}, next);
}

exports.findByThreadId = function (threadId, next) {
	col.find({threadId: threadId}).sort({cdate: 1}).toArray(next);
}

