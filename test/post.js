var _ = require('underscore');
var _should = require('should');
var _async = require('async');

var _lang = require('../main/lang');
var _db = require('../main/db');
var _post = require('../main/model/post');

var now = new Date();
var col;

before(function (next) {
	_lang.addBeforeInit(function (next) {
		_db.initParam = { mongoDbName: "sleek-test", dropDatabase: true };
		next();
	});
	_lang.runInit(next);
})

before(function () {
	col = _post.col;
});

describe('post object,', function () {
	it('can be created', function () {
		var post = _post.make({
			threadId: 123,
			userName: 'snowman',
			text: 'cool text',
			cdate: now,
			visible: true
		});
		post.threadId.should.equal(123);
		post.text.should.equal('cool text');
	});
	it('can set new id', function () {
		var post = _post.make({});
		post.should.not.have.property('_id');
		_post.setNewId(post);
		post.should.have.property('_id');
		post._id.should.be.a('number');
	});
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

describe('post data access,', function () {
	var prevPost;
	before(function (next) {
		_async.forEachSeries([
			{
				threadId: 1000, cdate: new Date(10), visible: true,
				userName: 'snowman', text: 'cool post 11'
			},
			{
				threadId: 1000, cdate: new Date(20), visible: true,
				userName: 'snowman', text: 'cool post 12',
			},
			{
				threadId: 1000, cdate: new Date(30), visible: false,
				userName: 'snowman', text: 'cool post 13',
			},
			{
				threadId: 1010, cdate: new Date(10), visible: true,
				userName: 'snowman', text: 'cool post 21'
			},
			{
				threadId: 1010, cdate: new Date(20), visible: true,
				userName: 'snowman', text: 'cool post 22'
			}
		], function (obj, next) {
			var post = _post.make(obj);
			_post.setNewId(post);
			_post.insert(post, null, function (err) {
				if (post.text === 'cool post 21') prevPost = post;
				next();
			});
		}, next);
	});
	it('can insert record', function (next) {
		col.count(function (err, count) {
			if (err) return next(err);
			count.should.equal(5);
			next();
		});
	});
	it('can get by id', function (next) {
		_post.findById(prevPost._id, function (err, post) {
			if (err) return next(err);
			post._id.should.equal(prevPost._id);
			post.text.should.equal(prevPost.text);
			next();
		});
	});
	it('can update record', function (next) {
		prevPost.userName = "fireman";
		prevPost.hit = 17;
		_post.update(prevPost, null, null, function (err) {
			_post.findById(prevPost._id, function (err, post) {
				if (err) return next();
				post.should.eql(prevPost);
				next();
			});
		});
	});

	describe('list,', function () {
		it('can be queried', function (next) {
			_post.findByThreadId(1000, function (err, list) {
				if (err) return next();
				list.should.length(3);
				next();
			})
		});
		it('can be queried 2', function (next) {
			_post.findByThreadId(1010, function (err, list) {
				if (err) return next();
				list.should.length(2);
				next();
			})
		});
		it('should be sorted', function (next) {
			_post.findByThreadId(1000, function (err, list) {
				if (err) return next();
				list[0].cdate.should.below(list[1].cdate);
				list[1].cdate.should.below(list[2].cdate);
				next();
			})
		});

	}); // describe('list'
}); // describe('Post data access'
