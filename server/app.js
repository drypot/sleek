
process.on('uncaughtException', function (err) {
	console.error('UNCAUGHT EXCEPTION');
	console.error(err.stack);
});

var configPath;

for (var i = 2; i < process.argv.length; i++) {
	var arg = process.argv[i];
	if (arg.indexOf('--') === 0) {
		//
	} else {
		configPath = arg;
	}
}

var config = require('./main/config')({ path: configPath });
var role = require('./main/role')({ config: config });

require('./main/mongo')({ config: config }, function (mongo) {
	require('./main/es')({ config: config }, function (es) {
		var app = require('express')();
		require('./main/express')({ config: config, role: role, store: 'redis', app: app });
		require('./main/hello-api')({ app: app });
		app.listen(config.port);
		console.log("express: %d", config.port);
	});
});

//require('./main/session-api.js');
//require('./main/upload-api.js');
//require('./main/post-api.js');
//require('./main/search-api.js');
