import fs from "fs";
import path from "path";
import * as init from '../base/init.js';
import * as config from '../base/config.js';
import * as expb from '../express/express-base.js';
import * as fs2 from "../base/fs2.js";

//const multiparty = require('multiparty');
//const busboy = require('busboy');
import multer from "multer";

let tmpDir;
let multerInst;

init.add((done) => {
  console.log('upload: ' + config.prop.uploadDir);
  tmpDir = config.prop.uploadDir + '/tmp';
  multerInst = multer({ dest: tmpDir });
  fs2.makeDir(tmpDir, function (err) {
    if (err) return done(err);
    fs2.emptyDir(tmpDir, done);
  });

  if (config.prop.dev) {
    expb.core.get('/test/upload', function (req, res) {
      res.render('express/express-upload');
    });

    expb.core.all('/api/test/echo-upload', handler(function (req, res, done) {
      const paths = [];
      if (req.files) {
        Object.keys(req.files).forEach(function (field) {
          req.files[field].forEach(function (file) {
            paths.push(file.originalFilename);
          });
        });
      }
      res.json({
        method: req.method,
        rtype: req.header('content-type'),
        query: req.query,
        body: req.body,
        files: paths
      });
      done();
    }));
  }
});

// req.files is undefined or
//
// {
//   f1: [ {   <-- input field name
//     fieldName: 'f1',
//     originalFilename: 'express-upload-f1.txt',
//     path: 'upload/rapixel-test/tmp/L-QT_2veCOSuKmOjdsFu3ivR.txt',
//      'content-disposition': 'form-data; name="f1"; filename="upload-f1.txt"',
//      'content-type': 'text/plain'
//     size: 6,
//     safeFilename: 'express-upload-f1.txt'
//   }, {
//     ...
//   },
//     ...
//   ]
// }

/*
function handlerForMultiParty(inner) {
  return function (req, res, done) {
    if (req._body) return inner(req, res, done);
    const form = new multiparty.Form({uploadDir: tmpDir});
    const paths = [];
    form.parse(req, function(err, fields, files) {
      if (err) {
        res.writeHead(400, { 'content-type': 'text/plain' });
        res.end('invalid request: ' + err.message);
        return;
      }
      let key, val;
      for (key in fields) {
        val = fields[key];
        req.body[key] = val.length === 1 ? val[0] : val;
      }
      for (key in files) {
        files[key].forEach(function (file) {
          paths.push(file.path);
          if (file.originalFilename.trim()) {
            // XHR 이 빈 파일 필드를 보낸다.
            // 불필요한 req.files[key] 생성을 막기 위해 조건 처리는 가장 안쪽에서.
            if (!req.files) req.files = {};
            if (!req.files[key]) req.files[key] = [];
            file.safeFilename = fs2.safeFilename(path.basename(file.originalFilename));
            req.files[key].push(file);
          }
        });
      }
      inner(req, res, deleter);
    });

    function deleter(err) {
      const i = 0;

      function unlink() {
        if (i === paths.length) {
          if (err) done(err);
          return;
        }
        const path = paths[i++];
        fs.unlink(path, function (err) {
          setImmediate(unlink);
        });
      }
      unlink();
    }
  };
}
*/

function handlerForMulter(inner) {
  return function (req, res, done) {
    const paths = [];
    multerInst.any()(req, res, function (err) {
      if (err) return done(err);
      if (!req.files) return inner(req, res, done);
      const files = req.files;
      delete req.files;
      for (let file of files) {
        paths.push(file.path);
        if (file.originalname.trim()) {
          // XHR 이 빈 파일 필드를 보낸다.
          // 불필요한 req.files[key] 생성을 막기 위해 조건 처리는 가장 안쪽에서.
          let key = file.fieldname;
          if (!req.files) req.files = {};
          if (!req.files[key]) req.files[key] = [];
          file.safeFilename = fs2.safeFilename(path.basename(file.originalname));
          req.files[key].push(file);
        }
      }
      inner(req, res, deleter);
    });

    function deleter(err) {
      let i = 0;

      function unlink() {
        if (i === paths.length) {
          if (err) done(err);
          return;
        }
        const path = paths[i++];
        fs.unlink(path, function (err) {
          setImmediate(unlink);
        });
      }
      unlink();
    }
  }
}

export const handler = handlerForMulter;
