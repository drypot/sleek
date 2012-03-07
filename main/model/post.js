var _ = require('underscore');
var _should = require('should');
var _async = require('async');
var _fs = require('fs');
var _path = require('path');

var _lang = require('../lang');
var _config = require("../config");
var _db = require('../db');

var col;
var idSeed;

_lang.addInit(function (next) {
	col = exports.col = _db.db.collection("post");
	col.ensureIndex({threadId: 1, cdate: 1});
	_async.series([
		function (next) {
			col.find({}, {_id: 1}).sort({_id: -1}).limit(1).next(function (err, obj) {
				if (err) return next(err);
				idSeed = obj ? obj._id : 0;
				console.info('post id seed: ' + idSeed);
				next();
			});
		},
		function (next) {
			_fs.mkdir(_config.uploadDir + '/post', 0755, function (err) {
				if (err && err.code !== 'EEXIST') return next(err);
				next();
			});
		}
	], next);
});

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

var post = Post.prototype;

_lang.method(post, 'setNewId', function () {
	this._id = ++idSeed;
});

_lang.method(post, 'insert', function (file, next) {
	var _this = this;
	_this._saveFile(file, function (err) {
		if (err) return next(err);
		col.insert(_this);
		//searchService.newPost(thread, post);
		next();
	});
});

_lang.method(post, '_saveFile', function (file, next) {
	var _this = this;

	function saveOne(file, next) {
		if (file.size) {
			var dir = _config.uploadDir + '/post/' + Math.floor(_this._id / 10000);
			var path = dir + '/' + file.name;
			_fs.mkdir(dir, 0755, function (err) {
				if (err && err.code !== 'EEXIST') return next(err);
				_fs.rename(file.path, path, function (err) {
					if (err) return next(err);
					console.log('post ' + _this._id + ': ' + path);
					if (!_this.file) _this.file = [];
					_this.file.push(file.name);
					next();
				});
			});
		}
	}

	if (!file) {
		console.log('post ' + _this._id + ': no file');
		return next();
	}
	if (_.isArray(file)) {
		return _async.forEachSeries(file, saveOne, next);
	}
	saveOne(file, next);
});

//form._deleteFiles = function (next) {
//	console.log('delete postId: ' + this.postId);
//	console.log(_util.inspect(this.delFiles));
//	next();
//}


_lang.method(post, 'update', function (file, delFiles, next) {
	col.save(this, next);
});

// 	_async.series([

//		function (next) {
//			_this._deleteFiles(next);
//		},
//		function (next) {
//			_this._saveFiles(next);
//		},

//		searchService.updatePost(thread, post);

_lang.method(post, 'addFileName', function (name) {
	if (!this.fileNameList) {
		this.fileNameList = [];
	}
	this.fileNameList.push(name);
});

_lang.method(post, 'removeFileName', function (name) {
	if (this.fileNameList) {
		this.fileNameList = _.without(this.fileNameList, name);
		if (this.fileNameList.length == 0) {
			delete this.fileNameList;
		}
	}
});

//dpc.method(Post, 'hasFile', function () {
//	return this.fileNameList && this.fileNameList.length;
//});

//dpc.method(Post, 'isFirstPost', function (thread) {
//	return this.cdate - thread.cdate == 0;
//});

exports.make = function (obj) {
	return new Post(obj);
}

var setProto = exports.setProto = function (obj) {
	obj.__proto__ = post;
}

exports.findById = function (id, next) {
	return col.findOne({_id: id}, function (err, obj) {
		if (err) return next(err);
		setProto(obj);
		next(err, obj);
	});
}

exports.findList = function (threadId, next) {
	col.find({threadId: threadId}).sort({cdate: 1}).toArrayWithProto(post, next);
}

