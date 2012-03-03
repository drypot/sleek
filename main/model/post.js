var _ = require('underscore');
var _should = require('should');

var _lang = require('../lang');
var _db = require('../db');

var col;
var idSeed;

_lang.addInit(function (next) {
	col = exports.col = _db.db.collection("post");
	col.ensureIndex({threadId: 1, cdate: 1});
	col.find({}, {_id: 1}).sort({_id: -1}).limit(1).next(function (err, obj) {
		idSeed = obj ? obj._id : 0;
		console.info('post id seed: ' + idSeed);
		next(err);
	});
});

var Post = function (obj) {
//	int _id;
//	int threadId;
//	DateTime cdate;
//	boolean visible;
//	String userName;
//	String text;
//	List<String> fileNameList;
	_.extend(this, obj);
}

var post = Post.prototype;

_lang.method(post, 'setNewId', function () {
	this._id = ++idSeed;
});

_lang.method(post, 'insert', function (next) {
	col.insert(this, next);
});

_lang.method(post, 'update', function (next) {
	col.save(this, next);
});

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
		if (err) next(err, obj);
		setProto(obj);
		next(err, obj);
	});
}

exports.findList = function (threadId, next) {
	col.find({threadId: threadId}).sort({cdate: 1}).toArrayWithProto(post, next);
}

