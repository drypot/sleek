var request = superagent;

var l = {};

(function () {

	// for IE 7

	if (!window.localStorage) {
		window.localStorage = {
			getItem: function () {},
			setItem: function () {},
			removeItem: function () {}
		}
	}

	if (!window.console) {
		window.console = {
			log: function () {}
		}
	}

})();

(function () {

	window.init = {};

	var funcs = [];

	window.init.add = function (func) {
		funcs.push(func);
	};

	window.init.reset = function () {
		funcs = [];
	}

	window.init.run = function () {
		console.log('init:');
		console.log('before init: ' + Object.keys(window));

		var i = 0;
		var len = funcs.length;

		for (i = 0; i < len; i++) {
			funcs[i]();
		}

		console.log('after init: ' + Object.keys(window));
	};

	$(function () {
		init.run();
	});

	init.reset();

})();

init.add(function () {

	window.cache = {};

	cache.$window = $(window);
	cache.$document = $(document);
	cache.$content = $('#content');

//	cache.url = URI(location.toString());
//	cache.query = cache.url.query(true);

});

init.add(function () {

	window.ping = function () {
		request.get('/api/hello').end();
	};

	window.ping.repeat = function () {
		window.setInterval(function() {
			request.get('/api/hello').end();
		}, 1000 * 60 * 5); // 5 min
	};

});
