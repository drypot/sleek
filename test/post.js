var _should = require('should');

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

describe('post object', function () {
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
		post.setNewId();
		post.should.have.property('_id');
		post._id.should.be.a('number');
	});

	describe('fileNameList', function () {
		var post = _post.make({});
		it('should be null', function () {
			post.should.not.have.property('fileNameList');
		})
		it('can add filename', function () {
			post.addFileName('file1');
			post.should.have.property('fileNameList');
			post.fileNameList[0].should.eql('file1');
		});
		it('can add filename again', function () {
			post.addFileName('file2');
			post.fileNameList[1].should.eql('file2');
		});
		it('can remove filename', function () {
			post.removeFileName('file1');
			post.should.have.property('fileNameList');
			post.fileNameList.should.length(1);
		});
		it ('can remove none existing filename', function () {
			post.removeFileName('file1');
			post.should.have.property('fileNameList');
			post.fileNameList.should.length(1);
		});
		it ('can remove last filename', function () {
			post.removeFileName('file2');
			post.should.not.have.property('fileNameList');
		});
	});
});

describe('post collection', function () {
	it('should be ok', function () {
		col.should.be.ok;
	});
	it('should have no record', function (next) {
		col.count(function (err, count) {
			_should.ifError(err);
			count.should.equal(0);
			next(err);
		})
	});
	it('should have index', function (next) {
		col.indexes(function (err, indexList) {
			_should.ifError(err);
			indexList.should.be.instanceof(Array);
			indexList.should.be.length(2);
			next(err);
		});
	});
});

describe('post data access', function () {
	before(function () {
		function insertPost(pojo) {
			var obj = _post.make(pojo);
			obj.setNewId();
			obj.insert();
		}
		insertPost({
			threadId: 1000, cdate: new Date(10), visible: true,
			userName: 'snowman', text: 'cool post 11'
		});
		insertPost({
			threadId: 1000, cdate: new Date(20), visible: true,
			userName: 'snowman', text: 'cool post 12',
		});
		insertPost({
			threadId: 1000, cdate: new Date(30), visible: false,
			userName: 'snowman', text: 'cool post 13',
		});
		insertPost({
			threadId: 1010, cdate: new Date(10), visible: true,
			userName: 'snowman', text: 'cool post 21'
		});
		insertPost({
			threadId: 1010, cdate: new Date(20), visible: true,
			userName: 'snowman', text: 'cool post 22'
		});
	});
	function findOne(next) {
		col.findOne({text: 'cool post 21'}, function (err, obj) {
			_post.setProto(obj);
			next(err, obj);
		});
	}
	it('can insert record', function (next) {
		col.count(function (err, count) {
			_should.ifError(err);
			count.should.equal(5);
			next(err);
		});
	});
	it('can get by id', function (next) {
		findOne(function (err, obj) {
			_should.ifError(err);
			obj._id.should.ok;
			obj._id.should.be.a('number');
			_post.findById(obj._id, function (err, obj2) {
				_should.ifError(err);
				obj2.should.sameProto(_post.make({}));
				obj2._id.should.equal(obj._id);
				obj2.text.should.equal(obj.text);
				next(err);
			});
		});
	});
	it('can update record', function (next) {
		findOne(function (err, obj) {
			obj.userName = "fireman";
			obj.hit = 17;
			obj.update();
			_post.findById(obj._id, function (err, obj2) {
				_should.ifError(err);
				obj2.should.eql(obj);
				next(err);
			});
		});
	});

	describe('list', function () {
		it('can be queried', function (next) {
			_post.findList(1000, function (err, list) {
				_should.ifError(err);
				list.should.length(3);
				list[0].should.sameProto(_post.make({}));
				next(err);
			})
		});
		it('can be queried 2', function (next) {
			_post.findList(1010, function (err, list) {
				_should.ifError(err);
				list.should.length(2);
				list[0].should.sameProto(_post.make({}));
				next(err);
			})
		});
		it('should be sorted', function (next) {
			_post.findList(1000, function (err, list) {
				_should.ifError(err);
				list[0].cdate.should.below(list[1].cdate);
				list[1].cdate.should.below(list[2].cdate);
				next(err);
			})
		});

	}); // describe('list'
}); // describe('Post data access'
