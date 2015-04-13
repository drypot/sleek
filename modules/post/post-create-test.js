var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var mongop = require('../mongo/mongo')({ dropDatabase: true });
var exp = require('../express/express');
var userb = require('../user/user-base');
var userf = require('../user/user-fixture');
var postc = require('../post/post-create');
var local = require('../express/local');
var expect = require('../base/assert').expect

before(function (done) {
  init.run(done);
});

describe.only('creating thread', function () {
  it('given login', function (done) {
    userf.login('user', done);
  });
  it('should success', function (done) {
    var form = { cid: 100, writer: 'snowman', title: 'title 1', text: 'post 1' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      console.log(res.body.err);
      expect(res.body.err).not.exist;
      expect(res.body).property('tid');
      expect(res.body).property('pid');
      done();
    });
  });
  it('invalid category should fail', function (done) {
    var form = { cid: 9999, writer: 'snowman', title: 'title', text: 'text' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('INVALID_CATEGORY');
      done();
    });
  });
  it('should fail when title empty', function (done) {
    var form = { cid: 100, writer: 'snowman', title: ' ', text: 'text' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err.rc).equal(error.ERROR_SET);
      expect(res.body.err).error('FILL_TITLE');
      done();
    });
  });
  it('logn title should fail', function (done) {
    var bigTitle = 'big title title title title title title title title title title title title title title title title title title title title title title title title title title title title';
    var form = { cid: 100, writer: 'snowman', text: 'text', title: bigTitle };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('TITLE_TOO_LONG');
      done();
    });
  });
  it('should fail when writer empty', function (done) {
    var form = { cid: 100, writer: ' ', title: 'title', text: 'text' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('FILL_WRITER');
      done();
    });
  });
  it('should fail when writer big', function (done) {
    var form = { cid: 100, writer: '123456789012345678901234567890123', title: 'title', text: 'text' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('WRITER_TOO_LONG');
      done();
    });
  });
});

describe.skip('creating thread old', function () {
  it('given logged out', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.post('/api/posts', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err.rc).equal(error.NOT_AUTHENTICATED);
      done();
    });
  });
  it('given user session', function (done) {
    userf.login('user', done);
  });
 
});

describe.skip('creating thread in recycle bin', function () {
  it('given user session', function (done) {
    userf.login('user', done);
  });
  it('should fail', function (done) {
    var form = { cid: 40, writer: 'snowman', title: 'title', text: 'text' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err.rc).equal(error.INVALID_CATEGORY);
      done();
    });
  });
  it('given admin session', function (done) {
    userf.login('admin', done);
  });
  it('should success', function (done) {
    var form = { cid: 40, writer: 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
});
