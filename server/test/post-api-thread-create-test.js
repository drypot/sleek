var should = require('should');

var init = require('../main/init');
var config = require('../main/config')({ test: true });
var mongo = require('../main/mongo')({ dropDatabase: true });
var es = require('../main/es')({ dropIndex: true });
var express = require('../main/express');
var error = require('../main/error');
var ufix = require('../test/user-fixture');

require('../main/session-api');
require('../main/post-api');

before(function (next) {
	init.run(next);
});

before(function () {
	express.listen();
});

describe("creating thread", function () {
	it("given logged out", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		express.post('/api/threads', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should fail when cid invalid", function (next) {
		var form = { cid: 10100, writer: 'snowman', title: 'title', text: 'text' };
		express.post('/api/threads').send(form).end(function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.INVALID_CATEGORY);
			next();
		});
	});
	it("should fail when title empty", function (next) {
		var form = { cid: 101, writer: 'snowman', title: ' ', text: 'text' };
		express.post('/api/threads').send(form).end(function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.INVALID_DATA);
			res.body.err.fields.some(function (field) {
				return field.name === 'title' && field.msg === error.msg.FILL_TITLE;
			}).should.true;
			next();
		});
	});
	it("should fail when title big", function (next) {
		var bigTitle = 'big title title title title title title title title title title title title title title title title title title title title title title title title title title title title';
		var form = { cid: 101, writer: 'snowman', text: 'text', title: bigTitle };
		express.post('/api/threads').send(form).end(function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.INVALID_DATA);
			res.body.err.fields.some(function (field) {
				return field.name === 'title' && field.msg === error.msg.SHORTEN_TITLE;
			}).should.true;
			next();
		});
	});
	it("should fail when writer empty", function (next) {
		var form = { cid: 101, writer: ' ', title: 'title', text: 'text' };
		express.post('/api/threads').send(form).end(function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.INVALID_DATA);
			res.body.err.fields.some(function (field) {
				return field.name === 'writer' && field.msg === error.msg.FILL_WRITER;
			}).should.true;
			next();
		});
	});
	it("should fail when writer big", function (next) {
		var form = { cid: 101, writer: '123456789012345678901234567890123', title: 'title', text: 'text' };
		express.post('/api/threads').send(form).end(function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.INVALID_DATA);
			res.body.err.fields.some(function (field) {
				return field.name === 'writer' && field.msg === error.msg.SHORTEN_WRITER;
			}).should.true;;
			next();
		});
	});
	it("should success", function (next) {
		var form = { cid: 101, writer: 'snowman', title: 'title 1', text: 'post11' };
		express.post('/api/threads').send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.should.have.property('tid');
			res.body.should.have.property('pid');
			next();
		});
	});
});

describe("creating thread in recycle bin", function () {
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should fail", function (next) {
		var form = { cid: 40, writer: 'snowman', title: 'title', text: 'text' };
		express.post('/api/threads').send(form).end(function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.INVALID_CATEGORY);
			next();
		});
	});
	it("given admin session", function (next) {
		ufix.loginAdmin(next);
	});
	it("should success", function (next) {
		var form = { cid: 40, writer: 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' };
		express.post('/api/threads').send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});
});
