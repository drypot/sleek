var init = require('../base/init');
var express = require('../main/express');
var upload = require('../upload/upload');

init.add(function () {

  var app = express.app;

  console.log('upload-api:');

  app.post('/api/upload', function (req, res) {
    req.findUser(function (err) {
      if (err) return res.jsonErr(err);
      res.json(upload.getTmpFiles(req));
    });
  });

  app.del('/api/upload', function (req, res) {
    req.findUser(function (err) {
      if (err) return res.jsonErr(err);
      upload.deleteTmpFiles(req.body.files, function (err) {
        if (err) return res.jsonErr(err);
        res.json({});
      });
    });
  });

});
