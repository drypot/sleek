'use strict';

const fs = require('fs');
const path = require('path');
const fs2 = exports;

fs2.removeDir = function removeDir(p, done) {
  fs.stat(p, function (err, stat) {
    if (err) return done(err);
    if(stat.isFile()) {
      return fs.unlink(p, function (err) {
        if (err && err.code !== 'ENOENT') return done(err);
        done();
      });
    }
    if(stat.isDirectory()) {
      fs.readdir(p, function (err, fnames) {
        if (err) return done(err);
        var i = 0;
        function unlink() {
          if (i == fnames.length) {
            return fs.rmdir(p, function (err) {
              if (err && err.code !== 'ENOENT') return done(err);
              done();
            });
          }
          var fname = fnames[i++];
          removeDir(p + '/' + fname, function (err) {
            if (err) return done(err);
            setImmediate(unlink);
          });
        }
        unlink();
      });
    }
  });
};

fs2.emptyDir = function (p, done) {
  fs.readdir(p, function (err, fnames) {
    if (err) return done(err);
    var i = 0;
    function unlink() {
      if (i == fnames.length) {
        return done();
      }
      var fname = fnames[i++];
      fs2.removeDir(p + '/' + fname, function (err) {
        setImmediate(unlink);
      });
    }
    unlink();
  });
};

fs2.makeDir = function (p, done) {
  fs.mkdir(p, 0o755, function(err) {
    if (err && err.code === 'ENOENT') {
      fs2.makeDir(path.dirname(p), function (err) {
        if (err) return done(err);
        fs2.makeDir(p, done);
      });
    } else if (err && err.code !== 'EEXIST') {
      done(err);
    } else {
      done(null, p);
    }
  });
};

fs2.safeFilename = function (name) {
  var i = 0;
  var len = name.length;
  var safe = '';
  for (; i < len; i++) {
    var ch = name.charAt(i);
    var code = name.charCodeAt(i);
    if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || '`~!@#$%^&()-_+=[{]};\',. '.indexOf(ch) >= 0)
      safe += ch;
    else if (code < 128)
      safe += '_';
    else
      safe += ch;
  }
  return safe;
};

fs2.makeDeepPath = function (id, iter) {
  var path = '';
  for (iter--; iter > 0; iter--) {
    path = '/' + id % 1000 + path;
    id = Math.floor(id / 1000);
  }
  return id + path;
};

fs2.copy = function (src, tar, done) {
  var r = fs.createReadStream(src);
  var w = fs.createWriteStream(tar);
  r.on('error', function (err) {
    fs.unlinkSync(tar);
    done(err);
  });
  w.on('finish', function () {
    done();
  });
  w.on('error', function (err) {
    done(err);
  });
  r.pipe(w);
}
