var _ = require('underscore');
var async = require('async');
var fs = require('fs');
var path = require('path');
var l = require('./l.js');

require('./config.js');
require('./upload.js');
require('./express.js');
require('./session.js');

l.init(function () {

	l.e.post('/api/upload', function (req, res) {
		l.session.authorized(res, function () {
			res.json({
				rc: l.rc.SUCCESS,
				uploadTmp: l.upload.uploadTmp(req.files && req.files.uploading)
			});
		});
	});

});
