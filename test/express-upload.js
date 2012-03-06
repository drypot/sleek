var _ = require('underscore');
var _should = require('should');
var _request = require('request').defaults({json: true});
var _async = require('async');
var _childp = require('child_process');
var _path = require('path');

var _lang = require('../main/lang');
var _config = require("../main/config");
var _db = require('../main/db');
var _express = require("../main/express");

before(function (next) {
	_lang.addBeforeInit(function (next) {
		_config.initParam = { configPath: "config-dev/config-dev.xml" };
		_db.initParam = { mongoDbName: "sleek-test", dropDatabase: true };
		next();
	});
	_lang.runInit(next);
});

describe('upload', function () {
	it('should success', function (next) {
		_childp.execFile('/usr/bin/curl', ['-F', 'file=@test-data/1.jpg', 'localhost:8010/api/test/upload'], null, function (err, stdout, stderr) {
			var file = JSON.parse(stdout)[0];
			file.name.should.equal('1.jpg');
			_should.ok(!_path.existsSync(file.path));
			next(err);
		});
	});
	it('should success with korean', function (next) {
		_childp.execFile('/usr/bin/curl', ['-F', 'file=@test-data/4한글.jpg', 'localhost:8010/api/test/upload'], null, function (err, stdout, stderr) {
			var file = JSON.parse(stdout)[0];
			file.name.should.equal('4한글.jpg');
			next(err);
		});
	});
});

//