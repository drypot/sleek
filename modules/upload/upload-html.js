var init = require('../base/init');
var express2 = require('../main/express');
var upload = require('../upload/upload');

init.add(function () {

  var app = express2.app;

  console.log('upload-html:');

  app.post('/upload', function (req, res) {
    req.findUser(function (err) {
      if (err) return res.send(JSON.stringify(err));
      res.send(JSON.stringify(upload.getTmpFiles(req)));
    });
  });

});
