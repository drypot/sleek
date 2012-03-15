var _ = require('underscore');
var should = require('should');
var path = require('path');
var childp = require('child_process');

var l = require('../main/l.js');
var Post = require('../main/post-model-post.js');
var test = require('./test.js');

before(function (next) {
	test.prepare('config,mongo,express', next);
});

describe('post/upload', function () {
	var ptid;
	var ppid;

	function fexists(id, file) {
		return path.existsSync(Post.getUploadDir({_id: id}) + '/' + file);
	}

	it("can upload 1.jpg, 2.jpg", function (next) {
		childp.execFile('/usr/bin/curl', ['-F', 'file=@test-data/1.jpg', '-F', 'file=@test-data/2.jpg', test.url('/api/test/create-head-with-file')], null, function (err, stdout, stderr) {
			var body = JSON.parse(stdout);
			body.should.property('threadId');
			body.should.property('postId');
			ptid = body.threadId;
			ppid = body.postId;
			should(fexists(ppid, '1.jpg'));
			should(fexists(ppid, '2.jpg'));
			next(err);
		});
	});
	it("can delete 1.jpg", function (next) {
		test.post('/api/test/update-head-with-file', {threadId: ptid, postId: ppid, delFile: ['1.jpg']}, function (err, res, body) {
			should(!fexists(ppid, '1.jpg'));
			should(fexists(ppid, '2.jpg'));
			next(err);
		});
	});
	it("can upload 1.jpg again", function (next) {
		childp.execFile('/usr/bin/curl', ['-F', 'threadId=' + ptid, '-F', 'postId=' + ppid, '-F', 'file=@test-data/1.jpg', test.url('/api/test/update-head-with-file')], null, function (err, stdout, stderr) {
			should(fexists(ppid, '1.jpg'));
			should(fexists(ppid, '2.jpg'));
			next(err);
		});
	});
	it("can delete 1.jpg, 2.jpg", function (next) {
		test.post('/api/test/update-head-with-file', {threadId: ptid, postId: ppid, delFile: ['1.jpg', '2.jpg']}, function (err, res, body) {
			should(!fexists(ppid, '1.jpg'));
			should(!fexists(ppid, '2.jpg'));
			next(err);
		});
	});
});
