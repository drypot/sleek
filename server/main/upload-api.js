var init = require('./init');
var upload = require('./upload');
var express = require('./express');
var rcs = require('./rcs');

init.add(function () {

	var app = express.app;

	app.post('/api/upload', function (req, res) {
		req.authorized(function () {
			res.json({
				rc: rcs.SUCCESS,
				files: upload.tmpFiles(req.files.file)
			});
		});
	});

	app.del('/api/upload', function (req, res) {
		req.authorized(function () {
			upload.deleteTmpFiles(req.body.files);
			res.json({ rc: rcs.SUCCESS });
		});
	});

	console.log('upload-api:');
});
