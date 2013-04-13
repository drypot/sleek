var init = require('../main/init');
var upload = require('../main/upload');
var express = require('../main/express');
var rcs = require('../main/rcs');

init.add(function () {

	var app = express.app;

	app.post('/api/upload', function (req, res) {
		req.authorized(function (r) {
			if (r) {
				return res.json(r);
			}
			res.json({
				rc: rcs.SUCCESS,
				files: upload.tmpFiles(req.files.file)
			});
		});
	});

	app.del('/api/upload', function (req, res) {
		req.authorized(function (r) {
			if (r) {
				return res.json(r);
			}
			upload.deleteTmpFiles(req.body.files);
			res.json({ rc: rcs.SUCCESS });
		});
	});

	console.log('upload-api:');

});
