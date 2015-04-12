var expect = require('../base/chai').expect;

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var mongop = require('../mongo/mongo')({ dropDatabase: true });
var search = require('../search/search-base');
var exp = require('../express/express');
var userb = require('../user/user-base');
var userf = require('../user/user-fixture');
var local = require('../express/local');

require('../post/post-api');
require('../search/search-base-api');

before(function (done) {
  init.run(done);
});

describe('searching', function () {

  var docs = [
    { cid: 100, writer: 'snowman', title: 'title 1', text: 'apple orange banana' },
    { cid: 100, writer: 'snowman', title: 'title 2', text: 'apple orange pine' },
    { cid: 100, writer: 'snowman', title: 'title 3', text: '둥글게 네모나게' },
    { cid: 100, writer: 'santa',   title: 'title 4', text: '둥글게 세모나게' },
    { cid: 300, writer: 'santa',   title: 'title 5', text: '둥글게 동그랗게' },
    { cid: 300, writer: 'rudolph', title: 'title 6', text: 'text 6' },
    { cid:  40, writer: 'admin',   title: 'title 7', text: 'text 7' },
    { cid:  40, writer: 'admin',   title: 'title 8', text: 'text 8' }
  ];

  it('given logged out', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.get('/api/search', function (err, res) {
      expect(err).not.exist;
      res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
      done();
    });
  });
  it('given admin session', function (done) {
    userf.login('admin', done);
  });
  it('should success', function (done) {
    local.get('/api/search', function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      var r = res.body.posts;
      r.should.length(0);
      done();
    });
  });
  it('given threads', function (done) {
    var i = 0;
    var len = docs.length;
    (function insert() {
      if (i == len) return done();
      var doc = docs[i++];
      local.post('/api/threads').send(doc).end(function (err, res) {
        should.not.exists(err);
        should.not.exist(res.body.err);
        doc.pid = res.body.pid;
        doc.tid = res.body.tid;
        setImmediate(insert);
      });
    })();
  });
  it('given user session', function (done) {
    userf.login('user', done);
  });
  describe('user name', function () {
    it('should success', function (done) {
      local.get('/api/search').query({ q: 'snowman' }).end(function (err, res) {
        expect(err).not.exist;
        should.not.exist(res.body.err);
        var r = res.body.posts;
        r.should.length(3);
        r[0].thread.title.should.equal('title 3');
        r[1].thread.title.should.equal('title 2');
        r[2].thread.title.should.equal('title 1');
        done();
      });
    });
  });
  describe('title', function () {
    it('should success', function (done) {
      local.get('/api/search').query({ q: 'title 4' }).end(function (err, res) {
        expect(err).not.exist;
        should.not.exist(res.body.err);
        var r = res.body.posts;
        r.should.length(1);
        r[0].thread.title.should.equal('title 4');
        done();
      });
    });
  });
  describe('text', function () {
    it('should success', function (done) {
      local.get('/api/search').query({ q: 'apple orange' }).end(function (err, res) {
        expect(err).not.exist;
        should.not.exist(res.body.err);
        var r = res.body.posts;
        r.should.length(2);
        r[0].thread.title.should.equal('title 2');
        r[1].thread.title.should.equal('title 1');
        done();
      });
    });
    it('should success', function (done) {
      local.get('/api/search').query({ q: 'apple banana' }).end(function (err, res) {
        expect(err).not.exist;
        should.not.exist(res.body.err);
        var r = res.body.posts;
        r.should.length(1);
        r[0].thread.title.should.equal('title 1');
        done();
      });
    });
  });
  describe('hangul', function () {
    it('should success', function (done) {
      local.get('/api/search').query({ q: '둥글' }).end(function (err, res) {
        expect(err).not.exist;
        should.not.exist(res.body.err);
        var r = res.body.posts;
        r.should.length(3);
        r[0].thread.title.should.equal('title 5');
        r[1].thread.title.should.equal('title 4');
        r[2].thread.title.should.equal('title 3');
        done();
      });
    });
  });
  describe('recycle bin', function () {
    it('given user session', function (done) {
      userf.login('user', done);
    });
    it('should return no results', function (done) {
      local.get('/api/search').query({ q: 'admin' }).end(function (err, res) {
        expect(err).not.exist;
        should.not.exist(res.body.err);
        var r = res.body.posts;
        r.should.length(0);
        done();
      });
    });
    it('given admin session', function (done) {
      userf.login('admin', done);
    });
    it('should return results', function (done) {
      local.get('/api/search').query({ q: 'admin' }).end(function (err, res) {
        expect(err).not.exist;
        should.not.exist(res.body.err);
        var r = res.body.posts;
        r.should.length(2);
        done();
      });
    });
  });
});
