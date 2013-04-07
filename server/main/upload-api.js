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
		req.authorized(function () {
			res.json({
				rc: rcs.SUCCESS,
				tmpFiles: l.upload.tmpFiles(req.files && req.files.file)
			});
		});
	});

});
