var should = require('should');
var request = require('superagent').agent();
var express = require('express');

var rcs = require('../main/rcs');

var config = require('../main/config')({ test: true });

before(function (next) {
	require('../main/mongo')({ config: config, dropDatabase: true }, function (mongo) {
		require('../main/es')({ config: config, dropIndex: true }, function (es) {
			var auth = require('../main/auth')({ config: config });
			var upload = require('../main/upload')({ config: config });
			var post = require('../main/post')({ mongo: mongo, es: es, upload: upload});

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
	request.del(url + '/api/session', function (err, res) {
		res.status.should.equal(200);
		res.body.rc.should.equal(rcs.SUCCESS);
		next();
	});
}

function loginUser(next) {
	request.post(url + '/api/session').send({ password: '1' }).end(function (err, res) {
		res.status.should.equal(200);
		res.body.rc.should.equal(rcs.SUCCESS);
		res.body.role.name.should.equal('user');
		next();
	});
}

function loginAdmin(next) {
	request.post(url + '/api/session').send({ password: '3' }).end(function (err, res) {
		res.status.should.equal(200);
		res.body.rc.should.equal(rcs.SUCCESS);
		res.body.role.name.should.equal('admin');
		next();
	});
}

describe('post /api/thread', function () {
	it('given no session', function (next) {
		logout(next);
	});
	it("should fail", function (next) {
		request.post(url + '/api/thread', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next();
		});
	});
	it.skip('given user session', function (next) {
		loginUser(next);
	});
	it.skip("should fail when categoryId invalid", function (next) {
		var form = { categoryId: 10100, writer : 'snowman', title: 'title', text: 'text' };
		request.post(url + '/api/thread').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_CATEGORY);
			next();
		});
	});
	it.skip("should fail when title empty", function (next) {
		var form = { categoryId: 101, writer : 'snowman', title: ' ', text: 'text' };
		request.post(url + '/api/thread').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.title.indexOf(rcs.msgs.FILL_TITLE).should.not.equal(-1);
			next();
		});
	});
	it.skip("should fail when title big", function (next) {
		var bigTitle = 'big title title title title title title title title title title title title title title title title title title title title title title title title title title title title';
		var form = { categoryId: 101, writer : 'snowman', text: 'text', title: bigTitle };
		request.post(url + '/api/thread').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.title.indexOf(rcs.msgs.SHORTEN_TITLE).should.not.equal(-1);
			next();
		});
	});
	it.skip("should fail when writer empty", function (next) {
		var form = { categoryId: 101, writer : ' ', title: 'title', text: 'text' };
		request.post(url + '/api/thread').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.writer.indexOf(rcs.msgs.FILL_WRITER).should.not.equal(-1);
			next();
		});
	});
	it.skip("should fail when writer big", function (next) {
		var form = { categoryId: 101, writer : '123456789012345678901234567890123', title: 'title', text: 'text' };
		request.post(url + '/api/thread').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.writer.indexOf(rcs.msgs.SHORTEN_WRITER).should.not.equal(-1);
			next();
		});
	});
	it.skip('should fail when category is recycle bin', function (next) {
		var form = { categoryId: 40, writer : 'snowman', title: 'title', text: 'text' };
		request.post(url + '/api/thread').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_CATEGORY);
			next();
		});
	});
	it.skip('should success', function (next) {
		var form = { categoryId: 101, writer : 'snowman', title: 'title 1', text: 'head text 1' };
		request.post(url + '/api/thread').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.should.have.property('threadId');
			res.body.should.have.property('postId');
			next();
		});
	});
	it.skip('given admin session', function (next) {
		loginAdmin(next);
	});
	it.skip('should success when category is recycle bin', function (next) {
		var form = { categoryId: 40, writer : 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' };
		request.post(url + '/api/thread').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
});

