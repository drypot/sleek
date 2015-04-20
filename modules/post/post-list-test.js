var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var mongop = require('../mongo/mongo')({ dropDatabase: true });
var exp = require('../express/express');
var userb = require('../user/user-base');
var userf = require('../user/user-fixture');
var postn = require('../post/post-new');
var postl = require('../post/post-list');
var local = require('../express/local');
var expect = require('../base/assert').expect

before(function (done) {
  init.run(done);
});

describe('preparing sample docs', function () {
  var samples = [
    { cid: 40,  writer: 'snowman', title: 'rbin 1', text: 'text' },
    { cid: 100, writer: 'snowman', title: 'freetalk 1', text: 'text' },
    { cid: 100, writer: 'snowman', title: 'freetalk 2', text: 'text' },
    { cid: 100, writer: 'snowman', title: 'freetalk 3', text: 'text' },
    { cid: 100, writer: 'snowman', title: 'freetalk 4', text: 'text' },
    { cid: 120, writer: 'snowman', title: 'game 1', text: 'text' },
    { cid: 120, writer: 'snowman', title: 'game 2', text: 'text' },
    { cid: 120, writer: 'snowman', title: 'game 3', text: 'text' },
    { cid: 120, writer: 'snowman', title: 'game 4', text: 'text' }
  ];
  it('given admin', function (done) {
    userf.login('admin', done)
  });
  it('should success', function (done) {
    var i = 0;
    (function insert() {
      if (i < samples.length) {
        local.post('/api/posts').send(samples[i++]).end(function (err, res) {
          expect(err).not.exist;
          expect(res.body.err).not.exist;
          setImmediate(insert);
        });
        return;
      }
      done();
    })();
  });
});

describe('checking user', function () {
  it('given no login', function (done) {
    userf.logout(done);
  });
  it('api should fail', function (done) {
    local.get('/api/posts', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('NOT_AUTHENTICATED');
      done();
    });
  });
  it('/ should redirected', function (done) {
    local.get('/').redirects(0).end(function (err, res) {
      expect(err).exist;
      expect(res).status(302); // Moved Temporarily 
      expect(res).header('location', '/posts');
      done();
    });
  });
  it('/posts should redirected', function (done) {
    local.get('/posts').redirects(0).end(function (err, res) {
      expect(err).exist;
      expect(res).status(302); // Moved Temporarily 
      expect(res).header('location', '/users/login');
      done();
    });
  });
  it('given login', function (done) {
    userf.login('user', done);
  });
  it('api should success', function (done) {
    local.get('/api/posts', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
  it('/ should redirected', function (done) {
    local.get('/').redirects(0).end(function (err, res) {
      expect(err).exist;
      expect(res).status(302); // Moved Temporarily 
      expect(res).header('location', '/posts');
      done();
    });
  });
  it('/posts should success', function (done) {
    local.get('/posts').redirects(0).end(function (err, res) {
      expect(err).not.exist;
      expect(res.text).contains('<title>all');
      done();
    });
  });
});

describe('listing threads', function () {
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('category 0 should success', function (done) {
    local.get('/api/posts', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var threads = res.body.threads;
      expect(threads).length(9)
      expect(threads[0].title).equal('game 4');
      expect(threads[1].title).equal('game 3');
      expect(threads[2].title).equal('game 2');
      expect(threads[3].title).equal('game 1');
      expect(threads[4].title).equal('freetalk 4');
      expect(threads[5].title).equal('freetalk 3');
      expect(threads[6].title).equal('freetalk 2');
      expect(threads[7].title).equal('freetalk 1');
      expect(threads[8].title).equal('rbin 1');
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('category 0 should success', function (done) {
    local.get('/api/posts', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var threads = res.body.threads;
      expect(threads).length(8)
      expect(threads[0].title).equal('game 4');
      expect(threads[1].title).equal('game 3');
      expect(threads[2].title).equal('game 2');
      expect(threads[3].title).equal('game 1');
      expect(threads[4].title).equal('freetalk 4');
      expect(threads[5].title).equal('freetalk 3');
      expect(threads[6].title).equal('freetalk 2');
      expect(threads[7].title).equal('freetalk 1');
      expect(threads[8]).not.exist; // should not be rbin 6
      done();
    });
  });
  it('category 0 page 2 should success', function (done) {
    local.get('/api/posts').query({ c: 0, pg: 2, ps: 3 }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var threads = res.body.threads;
      expect(threads).length(3);
      expect(threads[0].title).equal('game 1');
      expect(threads[1].title).equal('freetalk 4');
      expect(threads[2].title).equal('freetalk 3');
      done();
    });
  });
  it('category 100 should success', function (done) {
    local.get('/api/posts').query({ c: 100 }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var threads = res.body.threads;
      expect(threads).length(4);
      expect(threads[0].title).equal('freetalk 4');
      done();
    });
  });
  it('category 40 should fail', function (done) {
    local.get('/api/posts').query({ c: 40 }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('INVALID_CATEGORY');
      done();
    });
  });
  it('category 0 should have category field', function (done) {
    local.get('/api/posts').query({ c: 0, ps: 1 }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var threads = res.body.threads;
      expect(threads[0]).property('_id');
      expect(threads[0].writer).equal('snowman');
      expect(threads[0].title).equal('game 4');
      expect(threads[0].hit).equal(0);
      expect(threads[0].length).equal(1);
      expect(threads[0].category.id).equal(120);
      expect(threads[0].category.name).equal('game');
      done();
    });
  });
  it('category 100 should have no category field', function (done) {
    local.get('/api/posts').query({ c: 100, ps: 1 }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var threads = res.body.threads;
      expect(threads[0]).property('_id');
      expect(threads[0].writer).equal('snowman');
      expect(threads[0].title).equal('freetalk 4');
      expect(threads[0].hit).equal(0);
      expect(threads[0].length).equal(1);
      expect(threads[0].category).not.exist;
      done();
    });
  });
  it('page 1 is not last', function (done) {
    local.get('/api/posts').query({ c: 0, pg: 1, ps: 4 }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      expect(res.body.last).false;
      done();
    });
  });
  it('page 2 is not last', function (done) {
    local.get('/api/posts').query({ c: 0, pg: 2, ps: 4 }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      expect(res.body.last).false;
      done();
    });
  });
  it('page 3 is last', function (done) {
    local.get('/api/posts').query({ c: 0, pg: 3, ps: 4 }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      expect(res.body.last).true;
      done();
    });
  });
});
