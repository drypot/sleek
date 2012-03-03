var _ = require('underscore');
var _should = require('should');
var _request = require('request').defaults({json: true});
var _async = require('async');

var _lang = require('../main/lang');
var _config = require("../main/config");

var urlBase;

_lang.addBeforeInit(function (next) {
	_config.initParam = { configPath: "config-dev/config-dev.xml" }
	next();
});

_lang.addAfterInit(function (next) {
	urlBase = "http://localhost:" + _config.appServerPort;

	_async.series([
		function (next) {
			_request.post({ url: urlBase + '/api/auth/login', body: { password: '1' } }, next);
		},
		function (next) {
			_request.post({
				url: urlBase + '/api/insert-thread',
				body: { categoryId: 10100, userName: 'snowman', title: 'title 1', text: 'text 1' }
			}, function (err, res, body) {
				console.log(body);
				next(err);
			});
		}
	], next);
});

_lang.runInit();
