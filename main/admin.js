var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = require('./l.js');
var config = require('./config.js');
var role$ = require('./role.js');
var category$ = require('./category.js');
var auth = require('./auth.js');
var form$ = require('./post-form.js');
var upload = require('./upload.js');

exports.register = function (ex) {
	ex.post('/api/config/reload', assertLoggedIn, assertRole('admin'), function (req, res) {
//		config.loadConfig();
//		categoryService.init();
	});
}
