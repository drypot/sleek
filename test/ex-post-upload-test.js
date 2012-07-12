var _ = require('underscore');
var should = require('should');
var path = require('path');
var l = require('../main/l.js');

require('../main/ex-session.js');
require('../main/ex-post.js');
require('../main/ex-upload.js');
require('../main/test.js');

before(function (next) {
	l.init.run(next);
});

describe('uploading post file', function () {
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	var tid1, pid11, pid12;
	it('and head', function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				tid1 = res.body.threadId;
				pid11 = res.body.postId;
				next(err);
			}
		);
	});
	var tmp;
	it('and file1.txt, file2.txt uploaded', function (next) {
		l.test.request.post('/api/upload', {}, ['file1.txt', 'file2.txt'],
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				tmp = res.body.tmp;
				l.upload.existsTmp(tmp[0].tmp).should.be.true;
				l.upload.existsTmp(tmp[1].tmp).should.be.true;
				next(err);
			}
		);
	});
	it('when creating post with tmp, tmp files must be saved', function (next) {
		l.test.request.post('/api/thread/' + tid1,
			{ userName : 'snowman', text: 'reply text 1', uploading: tmp },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				pid12 = res.body.postId;
				l.upload.postFileExists(pid12, 'file1.txt').should.be.true;
				l.upload.postFileExists(pid12, 'file2.txt').should.be.true;
				next(err);
			}
		);
	});
	it('when deleting file1.txt, file1.txt should be gone', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ userName: 'snowman', text: 'reply text', deleting: ['file1.txt'] },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				l.upload.postFileExists(pid12, 'file1.txt').should.be.false;
				l.upload.postFileExists(pid12, 'file2.txt').should.be.true;
				next(err);
			}
		);
	});
	it('given file1.txt re-uploaded', function (next) {
		l.test.request.post('/api/upload', {}, ['file1.txt'],
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				tmp = res.body.tmp;
				next(err);
			}
		);
	});
	it('when updating post with file1.txt, post should have file1.txt again', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ userName: 'snowman', text: 'reply text', uploading: tmp },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				l.upload.postFileExists(pid12, 'file1.txt').should.be.true;
				l.upload.postFileExists(pid12, 'file2.txt').should.be.true;
				next(err);
			}
		);
	});
	it('when deleting file1.txt and file2.txt, they should be gone', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ userName: 'snowman', text: 'reply text', deleting: ['file1.txt', 'file2.txt'] },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				l.upload.postFileExists(pid12, 'file1.txt').should.be.false;
				l.upload.postFileExists(pid12, 'file2.txt').should.be.false;
				next(err);
			}
		);
	});
	it('when updating post with non existing tmp, should success', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ userName: 'snowman', text: 'reply text', uploading: [{ org: 'abc.txt', tmp: 'xxxxxxxx' }] },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				next(err);
			}
		);
	});
	it('given file3.txt uploaded', function (next) {
		l.test.request.post('/api/upload', {}, ['file3.txt'],
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				tmp = res.body.tmp;
				next(err);
			}
		);
	});
	it('when updating with invalid file name, should success', function (next) {
		tmp[0].org = './../.../newName.txt';
		l.test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ userName: 'snowman', text: 'reply text', uploading: tmp },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				l.upload.postFileExists(pid12, 'newName.txt').should.be.true;
				next(err);
			}
		);
	});
	it('given file4.txt uploaded', function (next) {
		l.test.request.post('/api/upload', {}, ['file4.txt'],
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				tmp = res.body.tmp;
				next(err);
			}
		);
	});
	it('when updating with invalid file name 2, should success', function (next) {
		tmp[0].org = './../.../mygod#1 그리고 한글.txt';
		l.test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ userName: 'snowman', text: 'reply text', uploading: tmp },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				l.upload.postFileExists(pid12, 'mygod#1 그리고 한글.txt').should.be.true;
				next(err);
			}
		);
	});
	it('given file4.txt uploaded', function (next) {
		l.test.request.post('/api/upload', {}, ['file4.txt'],
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				tmp = res.body.tmp;
				next(err);
			}
		);
	});
	it('when updating with invalid file name 3, should success', function (next) {
		tmp[0].org = './../.../mygod#2 :?<>|.txt';
		l.test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ userName: 'snowman', text: 'reply text', uploading: tmp },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				should(l.upload.postFileExists(pid12, 'mygod#2 _____.txt'));
				next(err);
			}
		);
	});
});
