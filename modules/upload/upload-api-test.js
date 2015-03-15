var should = require('should');
var fs = require('fs');

var l = require('../base/util');
var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/sleek-test.json' });
var express2 = require('../main/express');
var upload = require('../upload/uploading');
var ufix = require('../user/user-fixture');

require('../user/user-auth-api');
require('../upload/upload-api');
require('../upload/upload-html');

function find(files, oname) {
  var file = l.find(files, function (file) {
    return file.oname === oname;
  });
  should.exist(file);
  return file;
}

function exists(file) {
  fs.existsSync(upload.getTmpPath(file.tname)).should.be.true;
}

function nexists(file) {
  fs.existsSync(upload.getTmpPath(file.tname)).should.be.false;
}

before(function (done) {
  init.run(done);
});

before(function () {
  express.listen();
});

it("given user session", function (done) {
  ufix.loginUser(done);
});

describe("uploading none", function () {
  it("should success", function (done) {
    express.post('/api/upload').end(function (err, res) {
      should.not.exist(err);
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.should.eql({});
      done();
    });
  });
});

describe("uploading one file", function () {
  it("should success", function (done) {
    var f1 = 'server/test/fixture/dummy1.txt';
    express.post('/api/upload').attach('file', f1).end(function (err, res) {
      should.not.exist(err);
      res.error.should.false;
      should.not.exist(res.body.err);
      should.exist(res.body.file);
      exists(find(res.body.file, 'dummy1.txt'));
      done();
    });
  });
});

describe("uploading two files", function () {
  it("should success", function (done) {
    var f1 = 'server/test/fixture/dummy1.txt';
    var f2 = 'server/test/fixture/dummy2.txt';
    express.post('/api/upload').attach('file', f1).attach('file', f2).end(function (err, res) {
      should.not.exist(err);
      res.error.should.false;
      should.not.exist(res.body.err);
      exists(find(res.body.file, 'dummy1.txt'));
      exists(find(res.body.file, 'dummy2.txt'));
      done();
    });
  });
});

describe("uploading two files to html", function () {
  it("should success", function (done) {
    var f1 = 'server/test/fixture/dummy1.txt';
    var f2 = 'server/test/fixture/dummy2.txt';
    express.post('/upload').attach('file', f1).attach('file', f2).end(function (err, res) {
      should.not.exist(err);
      res.error.should.false;
      should.not.exist(res.body.err);
      res.should.be.html;
      var body = JSON.parse(res.text);
      exists(find(body.file, 'dummy1.txt'));
      exists(find(body.file, 'dummy2.txt'));
      done();
    });
  });
});

describe("deleting file", function () {
  var _files;
  it("given three uploaded files", function (done) {
    var f1 = 'server/test/fixture/dummy1.txt';
    var f2 = 'server/test/fixture/dummy2.txt';
    var f3 = 'server/test/fixture/dummy3.txt';
    express.post('/api/upload').attach('file', f1).attach('file', f2).attach('file', f3).end(function (err, res) {
      should.not.exist(err);
      res.error.should.false;
      should.not.exist(res.body.err);
      _files = res.body.file;
      done();
    });
  });
  it("should success for dummy1.txt", function (done) {
    var files = [];
    var dummy1 = find(_files, 'dummy1.txt');
    exists(dummy1);
    files.push(dummy1.tname);
    express.del('/api/upload').send({ files: files }).end(function (err, res) {
      should.not.exist(err);
      res.error.should.false;
      should.not.exist(res.body.err);
      nexists(dummy1);
      done();
    });
  });
  it("should success for dummy2.txt and dummy3.txt", function (done) {
    var files = [];
    var dummy2 = find(_files, 'dummy2.txt');
    var dummy3 = find(_files, 'dummy3.txt');
    exists(dummy2);
    exists(dummy3);
    files.push(dummy2.tname);
    files.push(dummy3.tname);
    express.del('/api/upload').send({ files: files }).end(function (err, res) {
      should.not.exist(err);
      res.error.should.false;
      should.not.exist(res.body.err);
      nexists(dummy2);
      nexists(dummy3);
      done();
    });
  });
  it("should success for invalid file", function (done) {
    var files = [];
    var file = {
      oname: 'non-exist',
      tname: 'xxxxx-non-exist'
    };
    nexists(file);
    files.push(file.tname);
    express.del('/api/upload').send({ files: files }).end(function (err, res) {
      should.not.exist(err);
      res.error.should.false;
      should.not.exist(res.body.err);
      done();
    });
  });

});
