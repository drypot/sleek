var _ = require('underscore');
var _should = require('should');
var _async = require('async');
var _path = require('path');

var _lang = require('../main/lang');
var _config = require("../main/config");
var _db = require('../main/db');
var _post = require('../main/model/post');

var now = new Date();
var col;

before(function (next) {
	_lang.addBeforeInit(function (next) {
		_config.initParam = { configPath: "config-dev/config-dev.xml" };
		_db.initParam = { mongoDbName: "sleek-test", dropDatabase: true };
		next();
	});
	_lang.runInit(next);
})

before(function () {
	col = _post.col;
});

describe('post collection,', function () {
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

describe('post,', function () {
	it('can make post', function () {
		var post = {
			threadId: 123,
			username : 'snowman',
			text: 'cool text',
			cdate: now,
			visible: true
		};
		post.threadId.should.equal(123);
		post.text.should.equal('cool text');
	});
	it('can make new id', function () {
		var post = {};
		post.should.not.have.property('_id');
		_post.setNewId(post);
		post.should.have.property('_id');
		post._id.should.be.a('number');
	});
});

describe('post db,', function () {
	var prevPost;
	it('can insert records', function (next) {
		_async.forEachSeries([
			{
				threadId: 1000, cdate: new Date(10), visible: true,
				username : 'snowman', text: 'cool post 11'
			},
			{
				threadId: 1000, cdate: new Date(20), visible: true,
				username : 'snowman', text: 'cool post 12',
			},
			{
				threadId: 1000, cdate: new Date(30), visible: false,
				username : 'snowman', text: 'cool post 13',
			},
			{
				threadId: 1010, cdate: new Date(10), visible: true,
				username : 'snowman', text: 'cool post 21'
			},
			{
				threadId: 1010, cdate: new Date(20), visible: true,
				username : 'snowman', text: 'cool post 22'
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
		prevPost.username  = "fireman";
		prevPost.hit = 17;
		_post.update(prevPost, null, null, function (err) {
			_post.findById(prevPost._id, function (err, post) {
				if (err) return next();
				post.should.eql(prevPost);
				next();
			});
		});
	});
	describe('find by thread id', function () {
		it('should return posts', function (next) {
			_post.findByThreadId(1000, function (err, post) {
				if (err) return next();
				post.should.length(3);
				next();
			})
		});
		it('should return posts, 2', function (next) {
			_post.findByThreadId(1010, function (err, post) {
				if (err) return next();
				post.should.length(2);
				next();
			})
		});
		it('should return sorted', function (next) {
			_post.findByThreadId(1000, function (err, post) {
				if (err) return next();
				post[0].cdate.should.below(post[1].cdate);
				post[1].cdate.should.below(post[2].cdate);
				next();
			})
		});
	});
});

describe('post file,', function () {
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
			username : 'snowman', text: 'cool post 22',
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
			_should(!post.file);
			next(err);
		});
	});
});