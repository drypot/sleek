var should = require('should');
var fs = require('fs');

var l = require('../base/util');
var init = require('../base/init');
var error = require('../base/error');
var fs2 = require('../base/fs');
var config = require('../base/config')({ path: 'config/sleek-test.json' });
var mongo = require('../mongo/mongo')({ dropDatabase: true });
var express = require('../main/express');
var upload = require('../upload/upload');
var post = require('../post/post-base');
var ufix = require('../user/user-fixture');

require('../user/user-auth-api');
require('../post/post-api');
require('../upload/upload-api');

before(function (next) {
  fs2.emptyDir('tmp', next);
});

before(function (next) {
  init.run(next);
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
  it("given user session", function (next) {
    ufix.loginUser(next);
  });
  it("should success", function (next) {
    var form = { cid: 101, title: 't', writer: 'w', text: 't' };
    express.post('/api/threads').send(form).end(function (err, res) {
      should(!err);
      should(!res.error);
      should(!res.body.err);
      tid1 = res.body.tid;
      next();
    });
  });
});

describe("saving files", function () {
  it("given dummy1.txt, dummy2.txt", function (next) {
    express.post('/api/upload').attach('files', dummy1).attach('files', dummy2).end(function (err, res) {
      should(!err);
      should(!res.error);
      should(!res.body.err);
      files = res.body.files;
      find(files, 'dummy1.txt');
      find(files, 'dummy2.txt');
      next();
    });
  });
  it("should success", function (next) {
    var form = { cid: 101, title: 't', writer: 'w', text: 't', files: files };
    express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      pid1 = res.body.pid;
      exists(pid1, 'dummy1.txt');
      exists(pid1, 'dummy2.txt');
      next();
    });
  });
  it("can be confirmed", function (next) {
    express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      should(!res.error);
      should(!res.body.err);
      var files = res.body.post.files;
      files.should.length(2);
      files[0].should.property('name', 'dummy1.txt');
      files[0].should.property('url')
      files[1].should.property('name', 'dummy2.txt');
      files[1].should.property('url')
      next();
    });
  });
});

describe("deleting files", function () {
  it("should success", function (next) {
    var form = { writer: 'w', text: 't', dfiles: [ 'dummy1.txt' ] };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      notExists(pid1, 'dummy1.txt');
      exists(pid1, 'dummy2.txt');
      next();
    });
  });
  it("can be confirmed", function (next) {
    express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      should(!res.error);
      should(!res.body.err);
      var files = res.body.post.files;
      files.should.length(1);
      files[0].should.property('name', 'dummy2.txt');
      files[0].should.property('url')
      next();
    });
  });
});

describe("appending files", function () {
  it("given dummy3.txt", function (next) {
    express.post('/api/upload').attach('files', dummy3).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      files = res.body.files;
      next();
    });
  });
  it("should success", function (next) {
    var form = { writer: 'w', text: 't', files: files };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      exists(pid1, 'dummy2.txt');
      exists(pid1, 'dummy3.txt');
      next();
    });
  });
  it("can be confirmed", function (next) {
    express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      should(!res.error);
      should(!res.body.err);
      res.body.post.files.should.length(2);
      next();
    });
  });
});

describe("deleting again", function () {
  it("should success", function (next) {
    var form = { writer: 'w', text: 't', dfiles: [ 'dummy2.txt', 'dummy3.txt' ] };
    exists(pid1, 'dummy2.txt');
    exists(pid1, 'dummy3.txt');
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      notExists(pid1, 'dummy2.txt');
      notExists(pid1, 'dummy3.txt');
      next();
    });
  });
  it("can be confirmed", function (next) {
    express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      should(!res.error);
      should(!res.body.err);
      should(!res.body.post.files);
      next();
    });
  });
});

describe("saving non-existing file", function () {
  it("should success", function (next) {
    var form = { writer: 'w', text: 't', files: [{ oname: 'abc.txt', tname: 'xxxxxxxx' }] };
    express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      next();
    });
  });
});

describe("saving file with invalid name", function () {
  it("given dummy1.txt", function (next) {
    express.post('/api/upload').attach('files', dummy1).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      files = res.body.files;
      next();
    });
  });
  it("should success", function (next) {
    var form = { writer: 'w', text: 't', files: files };
    files[0].oname = './../.../newName.txt';
    express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      pid1 = res.body.pid;
      exists(pid1, 'newName.txt');
      next();
    });
  });
  it("can be confirmed", function (next) {
    express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      should(!res.error);
      should(!res.body.err);
      var files = res.body.post.files;
      files.should.length(1);
      files[0].should.property('name', 'newName.txt');
      files[0].should.property('url')
      next();
    });
  });
});

describe("saving file with invalid name 2", function () {
  it("given dummy1.txt", function (next) {
    express.post('/api/upload').attach('files', dummy1).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      files = res.body.files;
      next();
    });
  });
  it("should success", function (next) {
    var form = { writer: 'w', text: 't', files: files };
    files[0].oname = './../.../mygod#1 그리고 한글.txt';
    express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      pid1 = res.body.pid;
      exists(pid1, 'mygod#1 그리고 한글.txt');
      next();
    });
  });
  it("can be confirmed", function (next) {
    express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      should(!res.error);
      should(!res.body.err);
      var files = res.body.post.files;
      files.should.length(1);
      files[0].should.property('name', 'mygod#1 그리고 한글.txt');
      files[0].should.property('url')
      next();
    });
  });
});

describe("saving file with invalid name 3", function () {
  it("given dummy1.txt", function (next) {
    express.post('/api/upload').attach('files', dummy1).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      files = res.body.files;
      next();
    });
  });
  it("should success", function (next) {
    var form = { writer: 'w', text: 't', files: files };
    files[0].oname = './../.../mygod#2 :?<>|.txt';
    express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      pid1 = res.body.pid;
      exists(pid1, 'mygod#2 _____.txt');
      next();
    });
  });
  it("can be confirmed", function (next) {
    express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      should(!res.error);
      should(!res.body.err);
      res.body.post.files.should.length(1);
      res.body.post.files[0].should.property('name', 'mygod#2 _____.txt');
      res.body.post.files[0].should.property('url')
      next();
    });
  });
});
