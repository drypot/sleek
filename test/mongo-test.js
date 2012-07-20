var _ = require('underscore');
var should = require('should');
var async = require('async');
var l = require('../main/l');

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
		ppost.userName  = "fireman";
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
			post[0].cdate.should.below(post[1].cdate);
			post[1].cdate.should.below(post[2].cdate);
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
			categoryId: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(10),
			userName : 'snowman', title: 'cool thread 1'
		});
		insertThread({
			categoryId: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(11),
			userName : 'snowman', title: 'cool thread 2'
		});
		insertThread({
			categoryId: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(20),
			userName : 'snowman', title: 'cool thread 3'
		});
		insertThread({
			categoryId: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(20),
			userName : 'snowman', title: 'cool thread 4'
		});
		insertThread({
			categoryId: 103, hit: 10, length: 5, cdate: new Date(10), udate: new Date(30),
			userName : 'snowman', title: 'cool thread 5'
		});
		insertThread({
			categoryId: 103, hit: 10, length: 5, cdate: new Date(10), udate: new Date(40),
			userName : 'snowman', title: 'cool thread 6'
		});
		pthread = insertThread({
			categoryId: 104, hit: 10, length: 5, cdate: new Date(10), udate: new Date(50),
			userName : 'snowman', title: 'cool thread 7'
		});
	});
	it('can count records', function (next) {
		l.mongo.threadCol.count(function (err, count) {
			if (err) return next(err);
			count.should.equal(7);
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
		pthread.userName  = "fireman";
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
	it('can update lenth & udate', function (next) {
		var now = new Date();
		l.mongo.updateThreadLength(pthread, now);
		l.mongo.findThreadById(pthread._id, function (err, thread) {
			if (err) return next(err);
			thread.length.should.equal(pthread.length + 1);
			thread.udate.should.equal(now);
			next();
		});
	});
	it('can find all', function (next) {
		l.mongo.findThreadByCategory(0, null, 99, function (err, list) {
			if (err) return next(err);
			list.should.length(7);
			list[0].udate.should.above(list[1].udate);
			list[1].udate.should.above(list[2].udate);
			list[2].udate.should.above(list[3].udate);
			next();
		})
	});
	it('can find with limited', function (next) {
		l.mongo.findThreadByCategory(0, null, 3, function (err, thread) {
			if (err) return next(err);
			thread.should.length(3);
			next();
		})
	});
	it('can find with lastUpdate', function (next) {
		l.mongo.findThreadByCategory(0, new Date(20), 99, function (err, thread) {
			if (err) return next(err);
			thread.should.length(2);
			thread[0].udate.should.equal(new Date(11));
			thread[1].udate.should.equal(new Date(10));
			next();
		})
	});
	it('can find with categoryId', function (next) {
		l.mongo.findThreadByCategory(101, null, 99, function (err, thread) {
			if (err) return next(err);
			thread.should.length(4);
			next(err);
		});
	});
	it('can find with categoryId 2', function (next) {
		l.mongo.findThreadByCategory(103, null, 99, function (err, thread) {
			if (err) return next(err);
			thread.should.length(2);
			next(err);
		});
	});
});
