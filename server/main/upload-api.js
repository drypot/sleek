var init = require('../main/init');
var upload = require('../main/upload');
var express = require('../main/express');
var rcs = require('../main/rcs');

init.add(function () {

	var app = express.app;

	console.log('upload-api:');

	app.post('/api/upload', function (req, res) {
		req.role(function (err) {
			if (err) return res.json(err);
			res.json({
				rc: rcs.SUCCESS,
				files: upload.tmpFiles(req.files.file)
			});
		});
	});

	app.del('/api/upload', function (req, res) {
		req.role(function (err) {
			if (err) return res.json(err);
			upload.deleteTmpFiles(req.body.files);
			res.json({ rc: rcs.SUCCESS });
		});
	});

});
