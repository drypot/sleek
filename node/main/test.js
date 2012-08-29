//var _ = require('underscore');
var l = require('./l.js');

require('./config.js');
require('./request.js');

l.test = {};

l.init.beforeInit(function () {
	l.config.path = "config-dev/config-test.json";
	l.config.override.mongoDropDatabase = true;
	l.config.override.esDropIndex = true;
});

l.init.init(function() {
	l.test.request = l.request("http://localhost:" + l.config.serverPort);
});
