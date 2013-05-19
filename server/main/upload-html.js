var init = require('../main/init');
var upload = require('../main/upload');
var express = require('../main/express');
var error = require('../main/error');

init.add(function () {

	var app = express.app;

	console.log('upload-html:');

	app.post('/upload', function (req, res) {
		req.findUser(function (err) {
			if (err) return res.send(JSON.stringify(err));
			res.send(JSON.stringify({
				fnames: upload.getFilenames(req.files.file)
			}));
		});
	});

});
