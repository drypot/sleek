
import * as fs from "fs";
import * as path from "path";

export function removeDir(p, done) {
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
        let i = 0;
        function unlink() {
          if (i === fnames.length) {
            return fs.rmdir(p, function (err) {
              if (err && err.code !== 'ENOENT') return done(err);
              done();
            });
          }
          let fname = fnames[i++];
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

export function emptyDir(p, done) {
  fs.readdir(p, function (err, fnames) {
    if (err) return done(err);
    let i = 0;
    function unlink() {
      if (i === fnames.length) {
        return done();
      }
      let fname = fnames[i++];
      removeDir(p + '/' + fname, function (err) {
        setImmediate(unlink);
      });
    }
    unlink();
  });
};

export function makeDir(p, done) {
  fs.mkdir(p, 0o755, function(err) {
    if (err && err.code === 'ENOENT') {
      makeDir(path.dirname(p), function (err) {
        if (err) return done(err);
        makeDir(p, done);
      });
    } else if (err && err.code !== 'EEXIST') {
      done(err);
    } else {
      done(null, p);
    }
  });
};

export function safeFilename(name) {
  let i = 0;
  const len = name.length;
  let safe = '';
  for (; i < len; i++) {
    const ch = name.charAt(i);
    const code = name.charCodeAt(i);
    if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || '`~!@#$%^&()-_+=[{]};\',. '.indexOf(ch) >= 0)
      safe += ch;
    else if (code < 128)
      safe += '_';
    else
      safe += ch;
  }
  return safe;
};

export function makeDeepPath(id, iter) {
  let path = '';
  for (iter--; iter > 0; iter--) {
    path = '/' + id % 1000 + path;
    id = Math.floor(id / 1000);
  }
  return id + path;
};

export function copy(src, tar, done) {
  const r = fs.createReadStream(src);
  const w = fs.createWriteStream(tar);
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
