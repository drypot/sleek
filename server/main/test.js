//var _ = require('underscore');
var l = require('./l.js');

require('./config.js');
require('./request.js');

l.test = {};

l.init(-1, function () {
	l.config.path = "config/config-test.json";
	l.config.override.mongoDropDatabase = true;
	l.config.override.esDropIndex = true;
});

l.init(function() {
	l.test.request = new l.Request("http://localhost:" + l.config.serverPort);
});
