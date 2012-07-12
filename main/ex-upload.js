var _ = require('underscore');
var l = require('./l.js');

require('./ex.js');
require('./session.js');
require('./upload.js');

l.init.init(function () {

	l.ex.post('/api/upload', l.session.checkLogin(), function (req, res) {
		res.json({
			rc: l.rc.SUCCESS,
			tmp: l.upload.getTmp(req.files && req.files.uploading)
		});
	});

});

