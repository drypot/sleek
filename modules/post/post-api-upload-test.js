var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-http'));
chai.config.includeStack = true;

var fs = require('fs');

var l = require('../base/util');
var init = require('../base/init');
var error = require('../base/error');
var fs2 = require('../base/fs');
var config = require('../base/config')({ path: 'config/test.json' });
var mongo = require('../mongo/mongo')({ dropDatabase: true });
var exp = require('../main/express');
var upload = require('../upload/upload');
var post = require('../post/post-base');
var userf = require('../user/user-fixture');

require('../user/user-auth-api');
require('../post/post-api');
require('../upload/upload-api');

before(function (done) {
  fs2.emptyDir('tmp', done);
});

before(function (done) {
  init.run(done);
});

before(function () {
  express.listen();
});

var dummy1 = 'server/test/fixture/dummy1.txt';
var dummy2 = 'server/test/fixture/dummy2.txt';
var dummy3 = 'server/test/fixture/dummy3.txt';

require('superagent').Request.prototype.fields = function (obj) {
  for(var key in obj) {
    this.field(key, String(obj[key]));
  }
  return this;
}

function find(files, oname) {
  var file = l.find(files, function (file) {
    return file.oname === oname;
  });
  should.exist(file);
  return file;
}

function exists(pid, fname) {
  fs.existsSync(post.getFilePath(pid, fname)).should.be.true;
}

function notExists(pid, fname) {
  fs.existsSync(post.getFilePath(pid, fname)).should.be.false;
}

var files, tid1, pid1;

describe("creating thread", function () {
  it("given user session", function (done) {
    userf.login('user', done);
  });
  it("should success", function (done) {
    var form = { cid: 101, title: 't', writer: 'w', text: 't' };
    local.post('/api/threads').send(form).end(function (err, res) {
      should.not.exist(err);
      expect(err).not.exist;
      should.not.exist(res.body.err);
      tid1 = res.body.tid;
      done();
    });
  });
});

describe("saving files", function () {
  it("given dummy1.txt, dummy2.txt", function (done) {
    local.post('/api/upload').attach('files', dummy1).attach('files', dummy2).end(function (err, res) {
      should.not.exist(err);
      expect(err).not.exist;
      should.not.exist(res.body.err);
      files = res.body.files;
      find(files, 'dummy1.txt');
      find(files, 'dummy2.txt');
      done();
    });
  });
  it("should success", function (done) {
    var form = { cid: 101, title: 't', writer: 'w', text: 't', files: files };
    local.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      pid1 = res.body.pid;
      exists(pid1, 'dummy1.txt');
      exists(pid1, 'dummy2.txt');
      done();
    });
  });
  it("can be confirmed", function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      var files = res.body.post.files;
      files.should.length(2);
      files[0].should.property('name', 'dummy1.txt');
      files[0].should.property('url')
      files[1].should.property('name', 'dummy2.txt');
      files[1].should.property('url')
      done();
    });
  });
});

describe("deleting files", function () {
  it("should success", function (done) {
    var form = { writer: 'w', text: 't', dfiles: [ 'dummy1.txt' ] };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      notExists(pid1, 'dummy1.txt');
      exists(pid1, 'dummy2.txt');
      done();
    });
  });
  it("can be confirmed", function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      var files = res.body.post.files;
      files.should.length(1);
      files[0].should.property('name', 'dummy2.txt');
      files[0].should.property('url')
      done();
    });
  });
});

describe("appending files", function () {
  it("given dummy3.txt", function (done) {
    local.post('/api/upload').attach('files', dummy3).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      files = res.body.files;
      done();
    });
  });
  it("should success", function (done) {
    var form = { writer: 'w', text: 't', files: files };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      exists(pid1, 'dummy2.txt');
      exists(pid1, 'dummy3.txt');
      done();
    });
  });
  it("can be confirmed", function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      res.body.post.files.should.length(2);
      done();
    });
  });
});

describe("deleting again", function () {
  it("should success", function (done) {
    var form = { writer: 'w', text: 't', dfiles: [ 'dummy2.txt', 'dummy3.txt' ] };
    exists(pid1, 'dummy2.txt');
    exists(pid1, 'dummy3.txt');
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      notExists(pid1, 'dummy2.txt');
      notExists(pid1, 'dummy3.txt');
      done();
    });
  });
  it("can be confirmed", function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      should.not.exist(res.body.post.files);
      done();
    });
  });
});

describe("saving non-existing file", function () {
  it("should success", function (done) {
    var form = { writer: 'w', text: 't', files: [{ oname: 'abc.txt', tname: 'xxxxxxxx' }] };
    local.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      done();
    });
  });
});

describe("saving file with invalid name", function () {
  it("given dummy1.txt", function (done) {
    local.post('/api/upload').attach('files', dummy1).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      files = res.body.files;
      done();
    });
  });
  it("should success", function (done) {
    var form = { writer: 'w', text: 't', files: files };
    files[0].oname = './../.../newName.txt';
    local.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      pid1 = res.body.pid;
      exists(pid1, 'newName.txt');
      done();
    });
  });
  it("can be confirmed", function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      var files = res.body.post.files;
      files.should.length(1);
      files[0].should.property('name', 'newName.txt');
      files[0].should.property('url')
      done();
    });
  });
});

describe("saving file with invalid name 2", function () {
  it("given dummy1.txt", function (done) {
    local.post('/api/upload').attach('files', dummy1).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      files = res.body.files;
      done();
    });
  });
  it("should success", function (done) {
    var form = { writer: 'w', text: 't', files: files };
    files[0].oname = './../.../mygod#1 그리고 한글.txt';
    local.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      pid1 = res.body.pid;
      exists(pid1, 'mygod#1 그리고 한글.txt');
      done();
    });
  });
  it("can be confirmed", function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      var files = res.body.post.files;
      files.should.length(1);
      files[0].should.property('name', 'mygod#1 그리고 한글.txt');
      files[0].should.property('url')
      done();
    });
  });
});

describe("saving file with invalid name 3", function () {
  it("given dummy1.txt", function (done) {
    local.post('/api/upload').attach('files', dummy1).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      files = res.body.files;
      done();
    });
  });
  it("should success", function (done) {
    var form = { writer: 'w', text: 't', files: files };
    files[0].oname = './../.../mygod#2 :?<>|.txt';
    local.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      pid1 = res.body.pid;
      exists(pid1, 'mygod#2 _____.txt');
      done();
    });
  });
  it("can be confirmed", function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      res.body.post.files.should.length(1);
      res.body.post.files[0].should.property('name', 'mygod#2 _____.txt');
      res.body.post.files[0].should.property('url')
      done();
    });
  });
});
