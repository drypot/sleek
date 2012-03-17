var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = require('../main/l');
var Post = require('../main/post-model-post.js');
var test = require('./test.js');

before(function (next) {
	test.prepare('config,mongo', next);
})

describe('post collection', function () {
	it('should be ok', function () {
		Post.col.should.be.ok;
	});
	it('should have no record', function (next) {
		Post.col.count(function (err, count) {
			if (err) return next(err);
			count.should.equal(0);
			next();
		})
	});
	it('should have index', function (next) {
		Post.col.indexes(function (err, indexList) {
			if (err) return next(err);
			indexList.should.be.instanceof(Array);
			indexList.should.be.length(2);
			next();
		});
	});
});

describe('post/mongo', function () {
	var ppost;
	it('can make new id', function () {
		var id1 = Post.getNewId();
		var id2 = Post.getNewId();
		should(id1 < id2);
	});
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
			post._id = Post.getNewId();
			Post.insert(post, null, function (err) {
				if (post.text === 'cool post 21') ppost = post;
				next();
			});
		}, next);
	});
	it('can count records', function (next) {
		Post.col.count(function (err, count) {
			if (err) return next(err);
			count.should.equal(5);
			next();
		});
	});
	it('can find post by id', function (next) {
		Post.findById(ppost._id, function (err, post) {
			if (err) return next(err);
			post._id.should.equal(ppost._id);
			post.text.should.equal(ppost.text);
			next();
		});
	});
	it('can update', function (next) {
		ppost.userName  = "fireman";
		ppost.hit = 17;
		Post.update(ppost, null, null, function (err) {
			Post.findById(ppost._id, function (err, post) {
				if (err) return next();
				post.should.eql(ppost);
				next();
			});
		});
	});
	it('can find posts by thread id', function (next) {
		Post.findByThreadId(1000, function (err, post) {
			if (err) return next();
			post.should.length(3);
			next();
		})
	});
	it('can find posts by thread id, 2', function (next) {
		Post.findByThreadId(1010, function (err, post) {
			if (err) return next();
			post.should.length(2);
			next();
		})
	});
	it('can find posts as sorted', function (next) {
		Post.findByThreadId(1000, function (err, post) {
			if (err) return next();
			post[0].cdate.should.below(post[1].cdate);
			post[1].cdate.should.below(post[2].cdate);
			next();
		})
	});
});

describe('post/file', function () {
	var pp;
	it('can insert post without file', function (next) {
		var post = {_id: Post.getNewId()};
		Post.insert(post, null, function (err) {
			post.should.not.property('file');
			next(err);
		});
	});
	it('can save file', function (next) {
		var post = pp = {
			_id: Post.getNewId(),
			threadId: 1010, cdate: new Date(20), visible: true,
			userName : 'snowman', text: 'cool post 22'
		};
		var file = [
			{size: 10, name: '1.jpg', __skip:true},
			{size: 10, name: '2.jpg', __skip:true},
			{size: 10, name: '3.jpg', __skip:true}
		];
		Post.insert(post, file, function (err) {
			post.should.property('file');
			post.file.should.length(3);
			post.file.should.include('1.jpg');
			post.file.should.include('2.jpg');
			post.file.should.include('3.jpg');
			next();
		});
	});
	it('can delete file', function (next) {
		var post = pp;
		var delFile = ['2.jpg', '3.jpg', '4.jpg'];
		Post.update(post, null, delFile, function (err) {
			post.file.should.length(1);
			post.file.should.include('1.jpg');
			next(err);
		});
	});
	it('can delete & save file', function (next) {
		var post = pp;
		var file = [
			{size: 10, name: '1.jpg', __skip:true},
			{size: 10, name: '2.jpg', __skip:true}
		];
		var delFile = ['1.jpg'];
		Post.update(post, file, delFile, function (err) {
			post.file.should.length(2);
			post.file.should.include('1.jpg');
			post.file.should.include('2.jpg');
			next(err);
		});
	});
	it('can delete all', function (next) {
		var post = pp;
		var delFile = ['1.jpg', '2.jpg'];
		Post.update(post, null, delFile, function (err) {
			should(!post.file);
			next(err);
		});
	});
});