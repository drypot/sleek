
module.exports = function (opt) {

	var app = opt.app;
	var upload = opt.upload;

	app.post('/api/upload', function (req, res) {
		req.authorized(function () {
			res.json({
				rc: rcs.SUCCESS,
				tmpFiles: upload.tmpFiles(req.files && req.files.file)
			});
		});
	});

};
