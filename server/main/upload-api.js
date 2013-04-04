var _ = require('underscore');
var async = require('async');
var fs = require('fs');
var path = require('path');
var l = require('./l');

require('./config');
require('./upload');
require('./express');
require('./session');

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
