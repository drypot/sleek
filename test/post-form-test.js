var _ = require('underscore');
var _should = require('should');
var _request = require('request').defaults({json: true});
var _async = require('async');

var _lang = require('../main/lang');
var _config = require("../main/config");
var _db = require('../main/db');
var _form = require('../main/form/post-form')

var urlBase;

before(function (next) {
	_lang.addBeforeInit(function (next) {
		_config.initParam = { configPath: "config-dev/config-dev.xml" }
		_db.initParam = { mongoDbName: "sleek-test", dropDatabase: true };
		next();
	});
	_lang.runInit(next);
});

//ex.post('/api/test/parse-post-form', parseParams, function (req, res) {
//	var form = _postForm.make(req);
//	res.json(form);
//});
//
//ex.post('/api/test/validate-post-form-thread', parseParams, function (req, res) {
//	var form = _postForm.make(req);
//	var errors = [];
//	form.validateThread(errors);
//	res.json(200, { errors: errors });
//});
//
//ex.post('/api/test/validate-post-form-post', parseParams, function (req, res) {
//	var form = _postForm.make(req);
//	var errors = [];
//	form.validatePost(errors);
//	res.json(200, { errors: errors });
//});

xdescribe("parse-post-form", function () {
	it("should success", function (next) {
		_request.post({
			url: urlBase + '/api/test/parse-post-form',
			qs: {
				categoryId: 10, threadId: 20, postId: 30
			},
			body: {
				categoryId: 100, userName: ' snow man ',
				title: ' cool thread ', text: ' cool text ',
				visible: true,
				delFiles: ['file1', 'file2']
			}
		}, function (err, res, body) {
			res.should.status(200);
			body.now.should.ok;
			body.threadId.should.equal(20);
			body.postId.should.equal(30);
			body.categoryId.should.equal(100);
			body.userName.should.equal('snow man');
			body.title.should.equal('cool thread');
			body.text.should.equal('cool text');
			body.visible.should.equal(true);
			body.delFiles.should.eql(['file1', 'file2']);
			next(err);
		});
	});
});

xdescribe("thread validation", function () {
	it("should success", function (next) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-thread',
			body: { title: ' cool thread ' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(0);
			next(err);
		});
	});
	it("should fail with empty title", function (next) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-thread',
			body: { title: '  ' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(1);
			next(err);
		});
	});
	it("should fail with big title", function (next) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-thread',
			body: { title: ' big title title title title title title title title title title title title title title title title title title title title title title title title title title title title ' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(1);
			next(err);
		});
	});
});

xdescribe("post validation", function () {
	it("should success", function (next) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-post',
			body: { userName: ' snow man ' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(0);
			next(err);
		});
	});
	it("should fail with empty userName", function (next) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-post',
			body: { userName: ' ' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(1);
			next(err);
		});
	});
	it("should fail with big userName", function (next) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-post',
			body: { userName: '123456789012345678901234567890123' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(1);
			next(err);
		});
	});
});