var should = require('should');
var request = require('superagent').agent();
var express = require('express');

var rcs = require('../main/rcs');

var config = require('../main/config')({ test: true });
var auth = require('../main/auth')({ config: config });
var upload = require('../main/upload')({ config: config });

var mongo;
var es;
var post;

before(function (next) {
	require('../main/mongo')({ config: config, dropDatabase: true }, function (_mongo) {
		mongo = _mongo;
		require('../main/es')({ config: config, dropIndex: true }, function (_es) {
			es = _es;

			post = require('../main/post')({ mongo: mongo, es: es, upload: upload});

			var app = express();
			require('../main/express')({ config: config, auth: auth, app: app });
			require('../main/session-api')({ config: config, auth: auth, app: app });
			require('../main/post-api')({ post: post, app: app });
			app.listen(config.port);

			next();
		});
	});
});

var url = 'http://localhost:' + config.port;

function logout(next) {
	request.del(url + '/api/sessions', function (err, res) {
		res.status.should.equal(200);
		res.body.rc.should.equal(rcs.SUCCESS);
		next();
	});
}

function loginUser(next) {
	request.post(url + '/api/sessions').send({ password: '1' }).end(function (err, res) {
		res.status.should.equal(200);
		res.body.rc.should.equal(rcs.SUCCESS);
		res.body.role.name.should.equal('user');
		next();
	});
}

function loginAdmin(next) {
	request.post(url + '/api/sessions').send({ password: '3' }).end(function (err, res) {
		res.status.should.equal(200);
		res.body.rc.should.equal(rcs.SUCCESS);
		res.body.role.name.should.equal('admin');
		next();
	});
}

describe('post /api/threads', function () {
	it('given no session', function (next) {
		logout(next);
	});
	it("should fail", function (next) {
		request.post(url + '/api/threads', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next();
		});
	});
	it('given user session', function (next) {
		loginUser(next);
	});
	it("should fail when categoryId invalid", function (next) {
		var form = { categoryId: 10100, writer : 'snowman', title: 'title', text: 'text' };
		request.post(url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_CATEGORY);
			next();
		});
	});
	it("should fail when title empty", function (next) {
		var form = { categoryId: 101, writer : 'snowman', title: ' ', text: 'text' };
		request.post(url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.title.indexOf(rcs.msgs.FILL_TITLE).should.not.equal(-1);
			next();
		});
	});
	it("should fail when title big", function (next) {
		var bigTitle = 'big title title title title title title title title title title title title title title title title title title title title title title title title title title title title';
		var form = { categoryId: 101, writer : 'snowman', text: 'text', title: bigTitle };
		request.post(url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.title.indexOf(rcs.msgs.SHORTEN_TITLE).should.not.equal(-1);
			next();
		});
	});
	it("should fail when writer empty", function (next) {
		var form = { categoryId: 101, writer : ' ', title: 'title', text: 'text' };
		request.post(url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.writer.indexOf(rcs.msgs.FILL_WRITER).should.not.equal(-1);
			next();
		});
	});
	it("should fail when writer big", function (next) {
		var form = { categoryId: 101, writer : '123456789012345678901234567890123', title: 'title', text: 'text' };
		request.post(url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.writer.indexOf(rcs.msgs.SHORTEN_WRITER).should.not.equal(-1);
			next();
		});
	});
	it('should fail when category is recycle bin', function (next) {
		var form = { categoryId: 40, writer : 'snowman', title: 'title', text: 'text' };
		request.post(url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_CATEGORY);
			next();
		});
	});
	it('should success', function (next) {
		var form = { categoryId: 101, writer : 'snowman', title: 'title 1', text: 'head text 1' };
		request.post(url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.should.have.property('threadId');
			res.body.should.have.property('postId');
			next();
		});
	});
	it('given admin session', function (next) {
		loginAdmin(next);
	});
	it('should success when category is recycle bin', function (next) {
		var form = { categoryId: 40, writer : 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' };
		request.post(url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
});

describe("get /api/threads", function () {
	var samples = [
		{ categoryId: 100, writer : 'snowman', title: 'title 1', text: 'text 1' },
		{ categoryId: 100, writer : 'snowman', title: 'title 2', text: 'text 2' },
		{ categoryId: 100, writer : 'snowman', title: 'title 3', text: 'text 3' },
		{ categoryId: 100, writer : 'snowman', title: 'title 4', text: 'text 4' },
		{ categoryId: 300, writer : 'snowman', title: 'title 5', text: 'text 5' },
		{ categoryId: 300, writer : 'snowman', title: 'title 6', text: 'text 6' },
		{ categoryId: 400, writer : 'snowman', title: 'title 7', text: 'text 7' }
	];

	before(function (next) {
		mongo.db.dropDatabase(next);
	});
	before(function (next) {
		mongo.ensureThreads(next);
	});
	before(function (next) {
		mongo.ensurePosts(next);
	});
	before(function (next) {
		mongo.posts.count(function (err, count) {
			should.not.exist(err);
			count.should.equal(0);
			next();
		});
	});
	it('given sample threads', function (next) {
		async.forEachSeries(samples, function (item, next) {
			request.post(url + '/api/threads', item, next);
		}, next);
	});
	it('given no session', function (next) {
		logout(next);
	});
	it("should fail", function (next) {
		request.post(url + '/api/threads', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next();
		});
	});
	it('given user session', function (next) {
		loginUser(next);
	});
	var t;
	it.skip('when no op, should success', function (next) {
		request.get('/api/threads', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.thread.should.length(7);

			t = res.body.thread[0];
			t.id.should.ok;
			t.category.id.should.equal(400);
			t.writ.skiper.should.equal('snowman');
			t.tit.skiple.should.equal('tit.skiple 7');
			t.hit.skip.should.equal(0);
			t.length.should.equal(1);

			t = res.body.thread[6];
			t.id.should.ok;
			t.category.id.should.equal(100);
			t.writ.skiper.should.equal('snowman');
			t.tit.skiple.should.equal('tit.skiple 1');
			next(err);
		});
	});
	it.skip('when category 0, should success', function (next) {
		request.get('/api/threads', { c: 0 }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.thread.should.length(7);
			next(err);
		});
	});
	it.skip('when category 300, should success', function (next) {
		request.get('/api/threads', { c: 300 }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.thread.should.length(2);
			next(err);
		});
	});
	it.skip('when page 2, should success', function (next) {
		request.get('/api/threads', { c: 0, p: 2, ps: 3 }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.thread.should.length(3);
			res.body.thread[0].tit.skiple.should.equal('tit.skiple 4');
			res.body.thread[1].tit.skiple.should.equal('tit.skiple 3');
			res.body.thread[2].tit.skiple.should.equal('tit.skiple 2');
			next(err);
		});
	});
	it.skip('when page -1, should success', function (next) {
		request.get('/api/threads', { c: 0, p: -1, ps: 3 }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.thread.should.length(3);
			res.body.thread[0].tit.skiple.should.equal('tit.skiple 3');
			res.body.thread[1].tit.skiple.should.equal('tit.skiple 2');
			res.body.thread[2].tit.skiple.should.equal('tit.skiple 1');
			next(err);
		});
	});
});
