var _ = require('underscore');
var should = require('should');
var async = require('async');
var path = require('path');

var l = require('../main/l');
var config = require("../main/config");
var mongo = require('../main/mongo');
var _post = require('../main/post.js');

var now = new Date();
var col;

before(function (next) {
	l.addBeforeInit(function (next) {
		config.param = { configPath: "config-dev/config-dev.xml" };
		mongo.param = { mongoDbName: "sleek-test", dropDatabase: true };
		next();
	});
	l.runInit(next);
})

before(function () {
	col = _post.col;
});

describe('post collection', function () {
	it('should be ok', function () {
		col.should.be.ok;
	});
	it('should have no record', function (next) {
		col.count(function (err, count) {
			if (err) return next(err);
			count.should.equal(0);
			next();
		})
	});
	it('should have index', function (next) {
		col.indexes(function (err, indexList) {
			if (err) return next(err);
			indexList.should.be.instanceof(Array);
			indexList.should.be.length(2);
			next();
		});
	});
});

describe('setNewId', function () {
	it('can make new id', function () {
		var post = {};
		post.should.not.have.property('_id');
		_post.setNewId(post);
		post.should.have.property('_id');
		post._id.should.be.a('number');
	});
});

describe('post/mongo', function () {
	var prevPost;
	it('can insert records', function (next) {
		async.forEachSeries([
			{
				threadId: 1000, cdate: new Date(10), visible: true,
				userName : 'snowman', text: 'cool post 11'
			},
			{
				threadId: 1000, cdate: new Date(20), visible: true,
				userName : 'snowman', text: 'cool post 12',
			},
			{
				threadId: 1000, cdate: new Date(30), visible: false,
				userName : 'snowman', text: 'cool post 13',
			},
			{
				threadId: 1010, cdate: new Date(10), visible: true,
				userName : 'snowman', text: 'cool post 21'
			},
			{
				threadId: 1010, cdate: new Date(20), visible: true,
				userName : 'snowman', text: 'cool post 22'
			}
		], function (post, next) {
			_post.setNewId(post);
			_post.insert(post, null, function (err) {
				if (post.text === 'cool post 21') prevPost = post;
				next();
			});
		}, next);
	});
	it('can count records', function (next) {
		col.count(function (err, count) {
			if (err) return next(err);
			count.should.equal(5);
			next();
		});
	});
	it('can find post by id', function (next) {
		_post.findById(prevPost._id, function (err, post) {
			if (err) return next(err);
			post._id.should.equal(prevPost._id);
			post.text.should.equal(prevPost.text);
			next();
		});
	});
	it('can update', function (next) {
		prevPost.userName  = "fireman";
		prevPost.hit = 17;
		_post.update(prevPost, null, null, function (err) {
			_post.findById(prevPost._id, function (err, post) {
				if (err) return next();
				post.should.eql(prevPost);
				next();
			});
		});
	});
	it('can find posts by thread id', function (next) {
		_post.findByThreadId(1000, function (err, post) {
			if (err) return next();
			post.should.length(3);
			next();
		})
	});
	it('can find posts by thread id, 2', function (next) {
		_post.findByThreadId(1010, function (err, post) {
			if (err) return next();
			post.should.length(2);
			next();
		})
	});
	it('can find posts as sorted', function (next) {
		_post.findByThreadId(1000, function (err, post) {
			if (err) return next();
			post[0].cdate.should.below(post[1].cdate);
			post[1].cdate.should.below(post[2].cdate);
			next();
		})
	});
});

describe('post/file', function () {
	var prevPost;
	it('can insert post without file', function (next) {
		var post = {};
		_post.setNewId(post);
		_post.insert(post, null, function (err) {
			post.should.not.property('file');
			next(err);
		});
	});
	it('can save file', function (next) {
		var post = prevPost = {
			threadId: 1010, cdate: new Date(20), visible: true,
			userName : 'snowman', text: 'cool post 22',
		};
		var file = [
			{size: 10, name: '1.jpg', __skip:true},
			{size: 10, name: '2.jpg', __skip:true},
			{size: 10, name: '3.jpg', __skip:true}
		];
		_post.setNewId(post);
		_post.insert(post, file, function (err) {
			post.should.property('file');
			post.file.should.length(3);
			post.file.should.include('1.jpg');
			post.file.should.include('2.jpg');
			post.file.should.include('3.jpg');
			next();
		});
	});
	it('can delete file', function (next) {
		var post = prevPost;
		var delFile = ['2.jpg', '3.jpg', '4.jpg'];
		_post.update(post, null, delFile, function (err) {
			post.file.should.length(1);
			post.file.should.include('1.jpg');
			next(err);
		});
	});
	it('can delete & save file', function (next) {
		var post = prevPost;
		var file = [
			{size: 10, name: '1.jpg', __skip:true},
			{size: 10, name: '2.jpg', __skip:true}
		];
		var delFile = ['1.jpg'];
		_post.update(post, file, delFile, function (err) {
			post.file.should.length(2);
			post.file.should.include('1.jpg');
			post.file.should.include('2.jpg');
			next(err);
		});
	});
	it('can delete all', function (next) {
		var post = prevPost;
		var delFile = ['1.jpg', '2.jpg'];
		_post.update(post, null, delFile, function (err) {
			should(!post.file);
			next(err);
		});
	});
});