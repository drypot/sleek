var _ = require('underscore');
var express = require('express');
var redisStore = require('connect-redis')(express);
var fs = require('fs');

var l = require('./l.js');
var config = require('./config.js');
//var category = require('./category.js');
//var auth = require('./auth.js');
//var form = require('./post-form.js');
//var upload = require('./upload.js');

var e;

l.addInit(function (next) {
	e = express();

	var uploadTmpDir = config.uploadDir + '/tmp';
	console.log('upload tmp directory: ' + uploadTmpDir);
	fs.readdir(uploadTmpDir, function (err, files) {
		_.each(files, function (file) {
			fs.unlink(uploadTmpDir + '/' + file);
		});
	});

	e.configure(function () {
		e.use(express.cookieParser(config.cookieSecret));
		e.use(express.session({store: new redisStore()}));
		e.use(express.bodyParser({uploadDir: uploadTmpDir}));
		e.use(e.router);
	});
	e.configure('development', function () {
		e.use(express.errorHandler({dumpExceptions: true, showStack: true}));
	});
	e.configure('production', function () {
		e.use(express.errorHandler());
	});
	next();
});

l.addAfterInit(function (next) {
	e.post('/api/hello', function (req, res) {
		res.json('hello');
	});

	e.listen(config.appServerPort);
	console.info("express listening on port: %d", config.appServerPort);
	next();
});
