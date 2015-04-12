var expect = require('../base/chai').expect;

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var mongop = require('../mongo/mongo')({ dropDatabase: true });
var exp = require('../express/express');
var userb = require('../user/user-base');
var userf = require('../user/user-fixture');
var local = require('../express/local');

require('../post/post-api');

before(function (done) {
  init.run(done);
});

describe('listing threads', function () {
  var samples = [
    { cid: 100, writer: 'snowman', title: 'title 1', text: 'text 1' },
    { cid: 100, writer: 'snowman', title: 'title 2', text: 'text 2' },
    { cid: 100, writer: 'snowman', title: 'title 3', text: 'text 3' },
    { cid: 100, writer: 'snowman', title: 'title 4', text: 'text 4' },
    { cid: 300, writer: 'snowman', title: 'title 5', text: 'text 5' },
    { cid: 300, writer: 'snowman', title: 'title 6', text: 'text 6' },
    { cid: 400, writer: 'snowman', title: 'title 7', text: 'text 7' }
  ];

  it('given logged out', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.post('/api/threads', function (err, res) {
      expect(err).not.exist;
      res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
      done();
    });
  });
  it('given user session', function (done) {
    userf.login('user', done);
  });
  it('given sample threads', function (done) {
    var i = 0;
    var len = samples.length;
    (function insert() {
      if (i == len) return done();
      var item = samples[i++];
      local.post('/api/threads').send(item).end(function (err, res) {
        expect(err).not.exist;
        setImmediate(insert);
      });
    })();
  });
  it('should success when no op', function (done) {
    local.get('/api/threads', function (err, res) {
      should.not.exist(res.body.err);
      res.body.threads.should.length(7);

      var t;
      t = res.body.threads[0];
      t.should.have.property('_id');
      t.category.id.should.equal(400);
      t.writer.should.equal('snowman');
      t.title.should.equal('title 7');
      t.hit.should.equal(0);
      t.length.should.equal(1);

      t = res.body.threads[6];
      t.should.have.property('_id');
      t.category.id.should.equal(100);
      t.writer.should.equal('snowman');
      t.title.should.equal('title 1');
      done();
    });
  });
  it('should success with category 0', function (done) {
    local.get('/api/threads').query({ c: 0 }).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      res.body.threads.should.length(7);
      done();
    });
  });
  it('should success with category 300', function (done) {
    local.get('/api/threads').query({ c: 300 }).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      res.body.threads.should.length(2);
      done();
    });
  });
  it('should success with page 2', function (done) {
    local.get('/api/threads').query({ c: 0, pg: 2, ps: 3 }).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      res.body.threads.should.length(3);
      res.body.threads[0].title.should.equal('title 4');
      res.body.threads[1].title.should.equal('title 3');
      res.body.threads[2].title.should.equal('title 2');
      done();
    });
  });
  describe('last', function () {
    it('should be false with page 1', function (done) {
      local.get('/api/threads').query({ c: 0, pg: 1, ps: 3 }).end(function (err, res) {
        expect(err).not.exist;
        should.not.exist(res.body.err);
        res.body.last.should.false;
        done();
      });
    });
    it('should be false with page 2', function (done) {
      local.get('/api/threads').query({ c: 0, pg: 2, ps: 3 }).end(function (err, res) {
        expect(err).not.exist;
        should.not.exist(res.body.err);
        res.body.last.should.false;
        done();
      });
    });
    it('should be false with page 3', function (done) {
      local.get('/api/threads').query({ c: 0, pg: 3, ps: 3 }).end(function (err, res) {
        expect(err).not.exist;
        should.not.exist(res.body.err);
        res.body.last.should.true;
        done();
      });
    });
    it('should be false with page 4', function (done) {
      local.get('/api/threads').query({ c: 0, pg: 4, ps: 3 }).end(function (err, res) {
        expect(err).not.exist;
        should.not.exist(res.body.err);
        res.body.last.should.true;
        done();
      });
    });
  });
});
