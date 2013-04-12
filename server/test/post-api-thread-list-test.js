var _ = require('underscore');
var should = require('should');
var async = require('async');
var l = require('../main/l');

require('../main/session-api');
require('../main/post-api');
require('../main/test');

before(function (next) {
	l.init.run(next);
});


