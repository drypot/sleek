var _ = require('underscore');
var express = require('express');
var redisStore = require('connect-redis')(express);
var fs = require('fs');
var util = require('util');

var l = require('./l.js');
var config = require('./config.js');
var upload = require('./upload.js');

// for init func loading.
var Role = require('./role.js');
var Category = require('./category.js');
var Post = require('./post-model-post.js');
var Thread = require('./post-model-thread.js');

var e;

l.init.add(function (next) {
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

	require('./auth-api.js').register(e);
	require('./category-api.js').register(e);
	require('./post-api.js').register(e);
	//require('./search.js').register(e);

	next();
});

l.init.addAfter(function (next) {
	e.post('/api/hello', function (req, res) {
		res.json('hello');
	});

	e.configure('development', function () {
		e.post('/api/test/set-session-var', function (req, res) {
			req.session.test_var = req.body.value;
			res.json('ok');
		});

		e.post('/api/test/get-session-var', function (req, res) {
			res.json(req.session.test_var);
		});

		e.post('/api/test/upload', function (req, res) {
			upload.saveFile([config.uploadDir, 'tmp'], req.files.file, function (err, saved) {
//				console.log('body: ' + util.inspect(req.body));
//				console.log('files: ' + util.inspect(req.files));
				req.body.saved = saved;
				res.json(req.body);
			});
		});
	});

	e.listen(config.appServerPort);
	console.info("express listening on port: %d", config.appServerPort);
	next();
});
