var fs = require('fs');
var path = require('path');

var init = require('../base/init');
var config = require('../base/config');
var fs2 = require('basebase');

init.add(function (done) {

  console.log('upload: ' + config.data.uploadDir);

  exports.getTmpPath = function (fname) {
    return exports.tmp + '/' + fname;
  }

  exports.getTmpFiles = function (req) {
    var files = {};
    for (var key in req.files) {
      var group = req.files[key];
      if (!Array.isArray(group)) {
        pushFile(files, key, group);
      } else {
        for (var i = 0; i < group.length; i++) {
          pushFile(files, key, group[i]);
        }
      }
    }
    return files;
  };

  function pushFile(files, key, file) {
    if (/*file.size &&*/ file.name) {
      if (!files[key]) {
        files[key] = [];
      }
      files[key].push({
        oname: file.name,
        tname: path.basename(file.path)
      });
    }
  }

  exports.deleteTmpFiles = function (files, done) {
    if (files) {
      var i = 0;
      function del() {
        if (i == files.length) return done();
        var file = files[i++];
        fs.unlink(exports.getTmpPath(path.basename(file)), function (err) {
          if (err && err.code !== 'ENOENT') return done(err);
          setImmediate(del);
        });
      }
      del();
    }
  }

  var pathes = [
    exports.tmp = config.data.uploadDir + '/tmp',
    exports.pub = config.data.uploadDir + '/public',
    exports.pubPost = config.data.uploadDir + '/public/post'
  ];

  var i = 0;
  function mkdir() {
    if (i == pathes.length) {
      fs2.emptyDir(exports.tmp, done);
      return;
    }
    var p = pathes[i++];
    fs2.makeDirs(p, function (err) {
      if (err) return done(err);
      setImmediate(mkdir);
    })
  }
  mkdir();

});
