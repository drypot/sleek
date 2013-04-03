var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = require('../main/l.js');
var config = require('../main/config.js');
var mongo = require('../main/mongo.js');

before(function (next) {
	config.init({ test: true }, next);
});

before(function (next) {
	mongo.init({ dropDatabase: true }, next);
});

describe('mongo module', function () {
	it('should have db property', function () {
		should.exist(mongo.db);
	});
});

describe('db', function () {
	it('should have databaseName', function () {
		mongo.db.databaseName.should.equal('sleek-test');
	});
});

describe('empty post collection', function () {
	it('should exist', function () {
		should(mongo.postCol);
	});
	it('should be empty', function (next) {
		mongo.postCol.count(function (err, count) {
			should.not.exist(err);
			count.should.equal(0);
			next();
		})
	});
	it('should have two indexes', function (next) {
		mongo.postCol.indexes(function (err, index) {
			should.not.exist(err);
			index.should.be.instanceof(Array);
			index.should.be.length(2);
			next();
		});
	});
	it('can make serialized ids', function () {
		var id1 = mongo.getNewPostId();
		var id2 = mongo.getNewPostId();
		should(id1 < id2);
	});
});

describe('filled post collection', function () {
	var ppost;

	before(function () {
		function insert(post) {
			post._id = mongo.getNewPostId();
			mongo.insertPost(post);
			return post;
		}
		insert({
			threadId: 1000, created: new Date(10), visible: true,
			writer : 'snowman', text: 'cool post 11'
		});
		insert({
			threadId: 1000, created: new Date(20), visible: true,
			writer : 'snowman', text: 'cool post 12',
		});
		insert({
			threadId: 1000, created: new Date(30), visible: false,
			writer : 'snowman', text: 'cool post 13',
		});
		ppost = insert({
			threadId: 1010, created: new Date(10), visible: true,
			writer : 'snowman', text: 'cool post 21'
		});
		insert({
			threadId: 1010, created: new Date(20), visible: true,
			writer : 'snowman', text: 'cool post 22'
		});
	});
	it('can count records', function (next) {
		mongo.postCol.count(function (err, count) {
			should.not.exist(err);
			count.should.equal(5);
			next();
		});
	});
	it('can find post by id', function (next) {
		mongo.findPostById(ppost._id, function (err, post) {
			should.not.exist(err);
			post._id.should.equal(ppost._id);
			post.text.should.equal(ppost.text);
			next();
		});
	});
	it('can update', function (next) {
		ppost.writer  = "fireman";
		ppost.hxit = 17;
		mongo.updatePost(ppost, function (err) {
			mongo.findPostById(ppost._id, function (err, post) {
				should.not.exist(err);
				post.should.eql(ppost);
				next();
			});
		});
	});
	it('can find posts by thread id', function (next) {
		mongo.findPostByThread(1000, function (err, post) {
			should.not.exist(err);
			post.should.length(3);
			next();
		})
	});
	it('can find posts by thread id, 2', function (next) {
		mongo.findPostByThread(1010, function (err, post) {
			should.not.exist(err);
			post.should.length(2);
			next();
		})
	});
	it('can find posts as sorted', function (next) {
		mongo.findPostByThread(1000, function (err, post) {
			should.not.exist(err);
			post[0].created.should.below(post[1].created);
			post[1].created.should.below(post[2].created);
			next();
		})
	});
});

describe('empty thread collection', function () {
	it('should exist', function () {
		should.exist(mongo.threadCol);
	});
	it('should be empty', function (next) {
		mongo.threadCol.count(function (err, count) {
			should.not.exist(err);
			count.should.equal(0);
			next();
		})
	});
	it('should have one index', function (next) {
		mongo.threadCol.indexes(function (err, indexList) {
			should.not.exist(err);
			indexList.should.be.instanceof(Array);
			indexList.should.be.length(3);
			next();
		});
	});
	it('can make serialized ids', function () {
		var id1 = mongo.getNewThreadId();
		var id2 = mongo.getNewThreadId();
		should(id1 < id2);
	});
});

describe('filled thread collection', function () {
	var pthread;

	before(function () {
		function insert(thread) {
			thread._id = mongo.getNewThreadId();
			mongo.insertThread(thread);
			return thread;
		}
		insert({
			categoryId: 101, hit: 10, length: 5, created: new Date(10), updated: new Date(10),
			writer : 'snowman', title: 'title1'
		});
		insert({
			categoryId: 101, hit: 10, length: 5, created: new Date(10), updated: new Date(20),
			writer : 'snowman', title: 'title2'
		});
		insert({
			categoryId: 101, hit: 10, length: 5, created: new Date(10), updated: new Date(30),
			writer : 'snowman', title: 'title3'
		});
		insert({
			categoryId: 101, hit: 10, length: 5, created: new Date(10), updated: new Date(40),
			writer : 'snowman', title: 'title4'
		});
		insert({
			categoryId: 103, hit: 10, length: 5, created: new Date(10), updated: new Date(50),
			writer : 'snowman', title: 'title5'
		});
		insert({
			categoryId: 103, hit: 10, length: 5, created: new Date(10), updated: new Date(60),
			writer : 'snowman', title: 'title6'
		});
		insert({
			categoryId: 104, hit: 10, length: 5, created: new Date(10), updated: new Date(70),
			writer : 'snowman', title: 'title7'
		});
		insert({
			categoryId: 104, hit: 10, length: 5, created: new Date(10), updated: new Date(80),
			writer : 'snowman', title: 'title8'
		});
		insert({
			categoryId: 104, hit: 10, length: 5, created: new Date(10), updated: new Date(90),
			writer : 'snowman', title: 'title9'
		});
		pthread = insert({
			categoryId: 104, hit: 10, length: 5, created: new Date(10), updated: new Date(100),
			writer : 'snowman', title: 'title10'
		});
	});
	it('can count records', function (next) {
		mongo.threadCol.count(function (err, count) {
			should.not.exist(err);
			count.should.equal(10);
			next();
		});
	});
	it('can find by id', function (next) {
		mongo.findThreadById(pthread._id, function (err, thread) {
			should.not.exist(err);
			thread._id.should.equal(pthread._id);
			thread.title.should.equal(pthread.title);
			next();
		});
	});
	it('can update record', function (next) {
		pthread.writer  = "fireman";
		pthread.hit = 17;
		mongo.updateThread(pthread);
		mongo.findThreadById(pthread._id, function (err, thread) {
			should.not.exist(err);
			thread.should.eql(pthread);
			next();
		});
	});
	it('can increase hit', function (next) {
		mongo.updateThreadHit(pthread);
		mongo.findThreadById(pthread._id, function (err, thread) {
			should.not.exist(err);
			thread.hit.should.equal(pthread.hit + 1);
			next();
		});
	});
	it('can update lenth & updated', function (next) {
		var now = new Date();
		mongo.updateThreadLength(pthread, now);
		mongo.findThreadById(pthread._id, function (err, thread) {
			should.not.exist(err);
			thread.length.should.equal(pthread.length + 1);
			thread.updated.getTime().should.equal(now.getTime());
			next();
		});
	});
	describe('findThreadByCategory', function () {
		it('should success when categoryId is 0', function (next) {
			mongo.findThreadByCategory(0, 1, 99, function (err, thread) {
				should.not.exist(err);
				thread.should.length(10);
				thread[0].title.should.equal('title10');
				thread[1].title.should.equal('title9');
				thread[2].title.should.equal('title8');
				thread[9].title.should.equal('title1');
				next();
			})
		});
		it('should success when categoryId is 101', function (next) {
			mongo.findThreadByCategory(101, 1, 99, function (err, thread) {
				should.not.exist(err);
				thread.should.length(4);
				next();
			});
		});
		it('should success when page is 2', function (next) {
			mongo.findThreadByCategory(0, 2, 3, function (err, thread) {
				should.not.exist(err);
				thread.should.length(3);
				thread[0].title.should.equal('title7');
				thread[1].title.should.equal('title6');
				thread[2].title.should.equal('title5');
				next();
			})
		});
		it('should success when page is -1', function (next) {
			mongo.findThreadByCategory(0, -1, 3, function (err, thread) {
				should.not.exist(err);
				thread.should.length(3);
				thread[0].title.should.equal('title1');
				thread[1].title.should.equal('title2');
				thread[2].title.should.equal('title3');
				next();
			})
		});
	});
});
