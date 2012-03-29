var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = require('../main/l');
var mongo = require('../main/mongo.js');
var test = require('../main/test.js');

before(function (next) {
	test.prepare('config,mongo', next);
});

describe('mongo', function () {
	it('should have db property', function () {
		mongo.should.property('db');
	});
	describe('db', function () {
		it('should have name', function () {
			mongo.db.name.should.equal('sleek-test');
		});
	});
});


describe('post', function () {
	it('should be ok', function () {
		mongo.postCol.should.be.ok;
	});
	it('should have no record', function (next) {
		mongo.postCol.count(function (err, count) {
			if (err) return next(err);
			count.should.equal(0);
			next();
		})
	});
	it('should have two index', function (next) {
		mongo.postCol.indexes(function (err, indexList) {
			if (err) return next(err);
			indexList.should.be.instanceof(Array);
			indexList.should.be.length(2);
			next();
		});
	});
	it('can make new id', function () {
		var id1 = mongo.getNewPostId();
		var id2 = mongo.getNewPostId();
		should(id1 < id2);
	});
	var ppost;
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
			post._id = mongo.getNewPostId();
			mongo.insertPost(post, null, function (err) {
				if (post.text === 'cool post 21') ppost = post;
				next();
			});
		}, next);
	});
	it('can count records', function (next) {
		mongo.postCol.count(function (err, count) {
			if (err) return next(err);
			count.should.equal(5);
			next();
		});
	});
	it('can find post by id', function (next) {
		mongo.findPostById(ppost._id, function (err, post) {
			if (err) return next(err);
			post._id.should.equal(ppost._id);
			post.text.should.equal(ppost.text);
			next();
		});
	});
	it('can update', function (next) {
		ppost.userName  = "fireman";
		ppost.hit = 17;
		mongo.updatePost(ppost, null, null, function (err) {
			mongo.findPostById(ppost._id, function (err, post) {
				if (err) return next();
				post.should.eql(ppost);
				next();
			});
		});
	});
	it('can find posts by thread id', function (next) {
		mongo.findPostByThread(1000, function (err, post) {
			if (err) return next();
			post.should.length(3);
			next();
		})
	});
	it('can find posts by thread id, 2', function (next) {
		mongo.findPostByThread(1010, function (err, post) {
			if (err) return next();
			post.should.length(2);
			next();
		})
	});
	it('can find posts as sorted', function (next) {
		mongo.findPostByThread(1000, function (err, post) {
			if (err) return next();
			post[0].cdate.should.below(post[1].cdate);
			post[1].cdate.should.below(post[2].cdate);
			next();
		})
	});
});

describe('thread', function () {
	it('should be ok', function () {
		mongo.threadCol.should.be.ok;
	});
	it('should have no record', function (next) {
		mongo.threadCol.count(function (err, count) {
			if (err) return next(err);
			count.should.equal(0);
			next(err);
		})
	});
	it('should have index', function (next) {
		mongo.threadCol.indexes(function (err, indexList) {
			if (err) return next(err);
			indexList.should.be.instanceof(Array);
			indexList.should.be.length(3);
			next(err);
		});
	});
	it('can set new id', function () {
		var id1 = mongo.getNewThreadId();
		var id2 = mongo.getNewThreadId();
		should(id1 < id2);
	});
	var pthread;
	it('can insert thread', function () {
		function insertThread(thread) {
			thread._id = mongo.getNewThreadId();
			mongo.insertThread(thread);
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
	it('can count record', function (next) {
		mongo.threadCol.count(function (err, count) {
			if (err) return next(err);
			count.should.equal(7);
			next();
		});
	});
	it('can get by id', function (next) {
		mongo.findThreadById(pthread._id, function (err, thread) {
			if (err) return next(err);
			thread._id.should.equal(pthread._id);
			thread.title.should.equal(pthread.title);
			next(err);
		});
	});
	it('can update record', function (next) {
		pthread.userName  = "fireman";
		pthread.hit = 17;
		mongo.updateThread(pthread);
		mongo.findThreadById(pthread._id, function (err, thread) {
			if (err) return next(err);
			thread.should.eql(pthread);
			next();
		});
	});
	it('can increase hit', function (next) {
		mongo.updateThreadHit(pthread);
		mongo.findThreadById(pthread._id, function (err, thread) {
			if (err) return next(err);
			thread.hit.should.equal(pthread.hit + 1);
			next();
		});
	});
	it('can update lenth & udate', function (next) {
		var now = new Date();
		mongo.updateThreadLength(pthread, now);
		mongo.findThreadById(pthread._id, function (err, thread) {
			if (err) return next(err);
			thread.length.should.equal(pthread.length + 1);
			thread.udate.should.eql(now);
			next();
		});
	});
	it('can find all', function (next) {
		mongo.findThreadByCategory(0, null, 99, function (err, list) {
			if (err) return next(err);
			list.should.length(7);
			list[0].udate.should.above(list[1].udate);
			list[1].udate.should.above(list[2].udate);
			list[2].udate.should.above(list[3].udate);
			next();
		})
	});
	it('can find with limited', function (next) {
		mongo.findThreadByCategory(0, null, 3, function (err, thread) {
			if (err) return next(err);
			thread.should.length(3);
			next();
		})
	});
	it('can find with lastUpdate', function (next) {
		mongo.findThreadByCategory(0, new Date(20), 99, function (err, thread) {
			if (err) return next(err);
			thread.should.length(4);
			thread[0].udate.should.eql(new Date(20));
			thread[1].udate.should.eql(new Date(20));
			thread[2].udate.should.eql(new Date(11));
			next();
		})
	});
	it('can find with categoryId', function (next) {
		mongo.findThreadByCategory(101, null, 99, function (err, thread) {
			if (err) return next(err);
			thread.should.length(4);
			next(err);
		});
	});
	it('can find with categoryId 2', function (next) {
		mongo.findThreadByCategory(103, null, 99, function (err, thread) {
			if (err) return next(err);
			thread.should.length(2);
			next(err);
		});
	});
});
