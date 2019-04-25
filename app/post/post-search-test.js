'use strict';

const init = require('../base/init');
const error = require('../base/error');
const config = require('../base/config');
const mysql2 = require('../mysql/mysql2');
const expb = require('../express/express-base');
const userf = require('../user/user-fixture');
const postb = require('./post-base');
const postn = require('./post-new');
const postsr = require('./post-search');
const expl = require('../express/express-local');
const assert = require('assert');
const assert2 = require('../base/assert2');

before(function (done) {
  config.path = 'config/test.json';
  mysql2.dropDatabase = true;
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
    { cid: 100, writer: 'rudolph', title: 'title 7', text: 'text 7' },
    { cid:  40, writer: 'admin',   title: 'title 8', text: 'text 8' }
  ];
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('given posts', function (done) {
    var i = 0;
    var len = docs.length;
    (function insert() {
      if (i < len) {
        var doc = docs[i++];
        expl.post('/api/posts').send(doc).end(function (err, res) {
          assert.ifError(err);
          assert2.empty(res.body.err);
          doc.pid = res.body.pid;
          doc.tid = res.body.tid;
          setImmediate(insert);
        });
        return;
      }
      done();
    })();
  });
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    expl.get('/api/posts/search', function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'NOT_AUTHENTICATED'));
      done();
    });
  });
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('should success', function (done) {
    expl.get('/api/posts/search').query({ q: 'text' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.threads;
      assert2.e(r.length, 3);
      assert2.e(r[0].title, 'title 8');
      assert2.e(r[1].title, 'title 7');
      assert2.e(r[2].title, 'title 6');
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('should success', function (done) {
    expl.get('/api/posts/search').query({ q: 'text' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.threads;
      assert2.e(r.length, 2);
      assert2.e(r[0].title, 'title 7');
      assert2.e(r[1].title, 'title 6');
      done();
    });
  });
  it('user name should success', function (done) {
    expl.get('/api/posts/search').query({ q: 'snowman' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.threads;
      assert2.e(r.length, 3);
      assert2.e(r[0].title, 'title 3');
      assert2.e(r[1].title, 'title 2');
      assert2.e(r[2].title, 'title 1');
      done();
    });
  });
  it('title should success', function (done) {
    expl.get('/api/posts/search').query({ q: '+title +4' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.threads;
      assert2.e(r.length, 1);
      assert2.e(r[0].title, 'title 4');
      done();
    });
  });
  it('OR op should success ', function (done) {
    expl.get('/api/posts/search').query({ q: 'apple banana' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.threads;
      assert2.e(r.length, 2);
      assert2.e(r[0].title, 'title 2');
      assert2.e(r[1].title, 'title 1');
      done();
    });
  });
  it('AND op should success', function (done) {
    expl.get('/api/posts/search').query({ q: 'apple +banana' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.threads;
      assert2.e(r.length, 1);
      assert2.e(r[0].title, 'title 1');
      done();
    });
  });
  it('hangul should success', function (done) {
    expl.get('/api/posts/search').query({ q: '둥글' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.threads;
      assert2.e(r.length, 3);
      assert2.e(r[0].title, 'title 5');
      assert2.e(r[1].title, 'title 4');
      assert2.e(r[2].title, 'title 3');
      done();
    });
  });
});
