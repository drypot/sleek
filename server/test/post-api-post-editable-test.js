var should = require('should');
var request = require('superagent').agent();

var init = require('../main/init');
var config = require('../main/config').options({ test: true });
var mongo = require('../main/mongo').options({ dropDatabase: true });
var es = require('../main/es').options({ dropIndex: true });
var express = require('../main/express');
var rcs = require('../main/rcs');
var test = require('../main/test').options({ request: request });

require('../main/session-api');
require('../main/post-api');

before(function (next) {
	init.run(next);
});

before(function () {
	express.listen();
});

describe('editable field', function () {
	it('given user session', function (next) {
		request.post(test.url + '/api/sessions', { password: '1' }, next);
	});
	var t1, p11, p12;
	it('and head t1, p11', function (next) {
		request.post(test.url + '/api/threads',
			{ categoryId: 101, writer: 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				t1 = res.body.threadId;
				p11 = res.body.postId;
				next();
			}
		);
	});
	it('and reply p12', function (next) {
		request.post(test.url + '/api/threads/' + t1,
			{ writer: 'snowman', text: 'reply text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				p12 = res.body.postId;
				next();
			}
		);
	});
	it('for p11, should be true', function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.true;
			next();
		});
	});
	it('for p12, should be true', function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.true;
			next();
		});
	});
	it('given new user session', function (next) {
		request.post(test.url + '/api/sessions', { password: '1' }, next);
	});
	it('for p11, should be false', function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.false;
			next();
		});
	});
	it('for p12, should be false', function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.false;
			next();
		});
	});
	it('given admin session', function (next) {
		request.post(test.url + '/api/sessions', { password: '3' }, next);
	});
	it('for p11, should be true', function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.true;
			next();
		});
	});
	it('for p12, should be true', function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.true;
			next();
		});
	});

});
