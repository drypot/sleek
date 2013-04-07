var rcs = require('../main/rcs');

module.exports = function (opt) {

	var app = opt.app;
	var upload = opt.upload;

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

};
