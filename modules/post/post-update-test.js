var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var mongop = require('../mongo/mongo')({ dropDatabase: true });
var exp = require('../express/express');
var userb = require('../user/user-base');
var userf = require('../user/user-fixture');
var local = require('../express/local');
var expect = require('../base/assert').expect

require('../post/post-api');

before(function (done) {
  init.run(done);
});

describe('updating', function () {
  var tid1, pid1;
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    express.put('/api/threads/0/0', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('NOT_AUTHENTICATED');
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('given p11', function (done) {
    var form = { cid: 101, writer: 'snowman', title: 'title', text: 'text' };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      tid1 = res.body.tid;
      pid1 = res.body.pid;
      done();
    });
  });
  it('should fail when title empty', function (done) {
    var form = { cid: 101, writer: 'snowman', title: ' ', text: 'text', visible: true };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('ERROR_SET');
      res.body.err.errors.some(function (field) {
        return field.name === 'title' && field.msg === error.TITLE_EMPTY;
      }).should.true;
      done();
    });
  });
  it('should fail when writer empty', function (done) {
    var form = { cid: 101, writer: ' ', title: 'title', text: 'text', visible: true };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('ERROR_SET');
      res.body.err.errors.some(function (field) {
        return field.name === 'writer' && field.msg === error.WRITER_EMPTY;
      }).should.true;
      done();
    });
  });
  it('should success when category not changed', function (done) {
    var form = { cid: 101, writer: 'snowman1', title: 'title1', text: 'text1' };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
  it('can be confirmed', function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      res.body.post.head.should.true;
      res.body.category.id.should.equal(101);
      res.body.post.writer.should.equal('snowman1');
      res.body.thread.title.should.equal('title1');
      res.body.post.text.should.equal('text1');
      res.body.post.visible.should.true;
      done();
    });
  });
  it('should success when category changed', function (done) {
    var form = { cid: 102, writer: 'snowman2', title: 'title2', text: 'text2' };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
  it('can be confirmed', function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      res.body.category.id.should.equal(102);
      done();
    });
  });
  it('should success but can not change visible', function (done) {
    var form = { cid: 102, writer: 'snowman3', title: 'title3', text: 'text3', visible: false };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
  it('can be confirmed', function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      res.body.post.visible.should.true;
      done();
    });
  });
  it('given new user session', function (done) {
    userf.login('user', done);
  });
  it('should fail after reloged', function (done) {
    var form = { cid: 102, writer: 'snowman3', title: 'title3', text: 'text3', visible: false };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      should.exist(res.body.err);
      expect(res.body.err).error('NOT_AUTHORIZED');
      done();
    });
  });
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('should success and can change visible', function (done) {
    var form = { cid: 102, writer: 'snowman4', title: 'title4', text: 'text4', visible: false };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
  it('can be confirmed', function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      res.body.post.visible.should.false;
      done();
    });
  });
});

describe('updating reply', function () {
  var tid1, pid1, pid2;
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('given pid1', function (done) {
    var form = { cid: 101, writer: 'snowman', title: 'title', text: 'text' };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      tid1 = res.body.tid;
      pid1 = res.body.pid;
      done();
    });
  });
  it('given pid2', function (done) {
    var form = { writer: 'snowman', text: 'text' };
    local.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      pid2 = res.body.pid;
      done();
    });
  });
  it('should success except visible field', function (done) {
    var form = { writer: 'snowman1', text: 'text1', visible: false };
    express.put('/api/threads/' + tid1 + '/' + pid2).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
  it('can be confirmed', function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid2, function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      res.body.post.head.should.false;
      res.body.post.writer.should.equal('snowman1');
      res.body.post.text.should.equal('text1');
      res.body.post.visible.should.true;
      done();
    });
  });
});

describe('updating recycle bin', function () {
  var tid1, pid1;
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('given p11 in recyle bin', function (done) {
    var form = { cid: 40, writer: 'snowman', title: 'title', text: 'text' };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      tid1 = res.body.tid;
      pid1 = res.body.pid;
      done();
    });
  });
  it('should success', function (done) {
    var form = { cid: 40, writer: 'snowman1', title: 'title1', text: 'text1' };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('should fail', function (done) {
    var form = { cid: 40, writer: 'snowman1', title: 'title1', text: 'text1' };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('INVALID_CATEGORY');
      done();
    });
  });
});
