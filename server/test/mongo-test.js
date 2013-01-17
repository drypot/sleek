var _ = require('underscore');
var should = require('should');
var async = require('async');
var l = require('../main/l.js');

require('../main/mongo.js');
require('../main/test.js');

before(function (next) {
	l.init.run(next);
});

describe('mongo', function () {
	it('should have db property', function () {
		should(l.mongo.db);
	});
});

describe('db', function () {
	it('should have databaseName, sleek-test', function () {
		l.mongo.db.databaseName.should.equal('sleek-test');
	});
});

describe('post collection', function () {
	it('should exist', function () {
		should(l.mongo.postCol);
	});
	it('should be empty', function (next) {
		l.mongo.postCol.count(function (err, count) {
			if (err) return next(err);
			count.should.equal(0);
			next();
		})
	});
	it('should have two indexes', function (next) {
		l.mongo.postCol.indexes(function (err, index) {
			if (err) return next(err);
			index.should.be.instanceof(Array);
			index.should.be.length(2);
			next();
		});
	});
	it('can make serialized ids', function () {
		var id1 = l.mongo.getNewPostId();
		var id2 = l.mongo.getNewPostId();
		should(id1 < id2);
	});
	var ppost;
	it('given records', function (next) {
		async.forEachSeries([
			{
				threadId: 1000, created: new Date(10), visible: true,
				writer : 'snowman', text: 'cool post 11'
			},
			{
				threadId: 1000, created: new Date(20), visible: true,
				writer : 'snowman', text: 'cool post 12',
			},
			{
				threadId: 1000, created: new Date(30), visible: false,
				writer : 'snowman', text: 'cool post 13',
			},
			{
				threadId: 1010, created: new Date(10), visible: true,
				writer : 'snowman', text: 'cool post 21'
			},
			{
				threadId: 1010, created: new Date(20), visible: true,
				writer : 'snowman', text: 'cool post 22'
			}
		], function (post, next) {
			post._id = l.mongo.getNewPostId();
			l.mongo.insertPost(post, function (err) {
				if (post.text === 'cool post 21') ppost = post;
				next();
			});
		}, next);
	});
	it('can count records', function (next) {
		l.mongo.postCol.count(function (err, count) {
			if (err) return next(err);
			count.should.equal(5);
			next();
		});
	});
	it('can find post by id', function (next) {
		l.mongo.findPostById(ppost._id, function (err, post) {
			if (err) return next(err);
			post._id.should.equal(ppost._id);
			post.text.should.equal(ppost.text);
			next();
		});
	});
	it('can update', function (next) {
		ppost.writer  = "fireman";
		ppost.hxit = 17;
		l.mongo.updatePost(ppost, function (err) {
			l.mongo.findPostById(ppost._id, function (err, post) {
				if (err) return next();
				post.should.eql(ppost);
				next();
			});
		});
	});
	it('can find posts by thread id', function (next) {
		l.mongo.findPostByThread(1000, function (err, post) {
			if (err) return next();
			post.should.length(3);
			next();
		})
	});
	it('can find posts by thread id, 2', function (next) {
		l.mongo.findPostByThread(1010, function (err, post) {
			if (err) return next();
			post.should.length(2);
			next();
		})
	});
	it('can find posts as sorted', function (next) {
		l.mongo.findPostByThread(1000, function (err, post) {
			if (err) return next();
			post[0].created.should.below(post[1].created);
			post[1].created.should.below(post[2].created);
			next();
		})
	});
});

describe('thread collection', function () {
	it('should exist', function () {
		should(l.mongo.threadCol);
	});
	it('should be empty', function (next) {
		l.mongo.threadCol.count(function (err, count) {
			if (err) return next(err);
			count.should.equal(0);
			next(err);
		})
	});
	it('should have one index', function (next) {
		l.mongo.threadCol.indexes(function (err, indexList) {
			if (err) return next(err);
			indexList.should.be.instanceof(Array);
			indexList.should.be.length(3);
			next(err);
		});
	});
	it('can make serialized ids', function () {
		var id1 = l.mongo.getNewThreadId();
		var id2 = l.mongo.getNewThreadId();
		should(id1 < id2);
	});
	var pthread;
	it('given records', function () {
		function insertThread(thread) {
			thread._id = l.mongo.getNewThreadId();
			l.mongo.insertThread(thread);
			return thread;
		}
		insertThread({
			categoryId: 101, hit: 10, length: 5, created: new Date(10), updated: new Date(10),
			writer : 'snowman', title: 'title1'
		});
		insertThread({
			categoryId: 101, hit: 10, length: 5, created: new Date(10), updated: new Date(20),
			writer : 'snowman', title: 'title2'
		});
		insertThread({
			categoryId: 101, hit: 10, length: 5, created: new Date(10), updated: new Date(30),
			writer : 'snowman', title: 'title3'
		});
		insertThread({
			categoryId: 101, hit: 10, length: 5, created: new Date(10), updated: new Date(40),
			writer : 'snowman', title: 'title4'
		});
		insertThread({
			categoryId: 103, hit: 10, length: 5, created: new Date(10), updated: new Date(50),
			writer : 'snowman', title: 'title5'
		});
		insertThread({
			categoryId: 103, hit: 10, length: 5, created: new Date(10), updated: new Date(60),
			writer : 'snowman', title: 'title6'
		});
		insertThread({
			categoryId: 104, hit: 10, length: 5, created: new Date(10), updated: new Date(70),
			writer : 'snowman', title: 'title7'
		});
		insertThread({
			categoryId: 104, hit: 10, length: 5, created: new Date(10), updated: new Date(80),
			writer : 'snowman', title: 'title8'
		});
		insertThread({
			categoryId: 104, hit: 10, length: 5, created: new Date(10), updated: new Date(90),
			writer : 'snowman', title: 'title9'
		});
		pthread = insertThread({
			categoryId: 104, hit: 10, length: 5, created: new Date(10), updated: new Date(100),
			writer : 'snowman', title: 'title10'
		});
	});
	it('can count records', function (next) {
		l.mongo.threadCol.count(function (err, count) {
			if (err) return next(err);
			count.should.equal(10);
			next();
		});
	});
	it('can find by id', function (next) {
		l.mongo.findThreadById(pthread._id, function (err, thread) {
			if (err) return next(err);
			thread._id.should.equal(pthread._id);
			thread.title.should.equal(pthread.title);
			next(err);
		});
	});
	it('can update record', function (next) {
		pthread.writer  = "fireman";
		pthread.hit = 17;
		l.mongo.updateThread(pthread);
		l.mongo.findThreadById(pthread._id, function (err, thread) {
			if (err) return next(err);
			thread.should.eql(pthread);
			next();
		});
	});
	it('can increase hit', function (next) {
		l.mongo.updateThreadHit(pthread);
		l.mongo.findThreadById(pthread._id, function (err, thread) {
			if (err) return next(err);
			thread.hit.should.equal(pthread.hit + 1);
			next();
		});
	});
	it('can update lenth & updated', function (next) {
		var now = new Date();
		l.mongo.updateThreadLength(pthread, now);
		l.mongo.findThreadById(pthread._id, function (err, thread) {
			if (err) return next(err);
			thread.length.should.equal(pthread.length + 1);
			thread.updated.should.equal(now);
			next();
		});
	});
	describe('findThreadByCategory', function () {
		it('when categoryId is 0, should success', function (next) {
			l.mongo.findThreadByCategory(0, 1, 99, function (err, thread) {
				if (err) return next(err);
				thread.should.length(10);
				thread[0].title.should.equal('title10');
				thread[1].title.should.equal('title9');
				thread[2].title.should.equal('title8');
				thread[9].title.should.equal('title1');
				next();
			})
		});
		it('when categoryId is 101, should success', function (next) {
			l.mongo.findThreadByCategory(101, 1, 99, function (err, thread) {
				if (err) return next(err);
				thread.should.length(4);
				next(err);
			});
		});
		it('when page is 2, should success', function (next) {
			l.mongo.findThreadByCategory(0, 2, 3, function (err, thread) {
				if (err) return next(err);
				thread.should.length(3);
				thread[0].title.should.equal('title7');
				thread[1].title.should.equal('title6');
				thread[2].title.should.equal('title5');
				next();
			})
		});
		it('when page is -1, should success', function (next) {
			l.mongo.findThreadByCategory(0, -1, 3, function (err, thread) {
				if (err) return next(err);
				thread.should.length(3);
				thread[0].title.should.equal('title1');
				thread[1].title.should.equal('title2');
				thread[2].title.should.equal('title3');
				next();
			})
		});
	});
});
