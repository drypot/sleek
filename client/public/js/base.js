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

	init.reset();

	$(function () {
		init.run();
	});

})();

init.add(function () {

	window.rc = {
		SUCCESS: 1,

		NOT_AUTHENTICATED: 101,
		NOT_AUTHORIZED: 102,
		INVALID_PASSWORD: 103,

		INVALID_DATA: 201,
		INVALID_CATEGORY: 202,
		INVALID_THREAD: 203,
		INVALID_POST: 204
	};

	window.msg = {
		FILL_TITLE: '제목을 입력해 주십시오.',
		SHORTEN_TITLE: '제목을 줄여 주십시오.',
		FILL_WRITER: '필명을 입력해 주십시오.',
		SHORTEN_WRITER: '필명을 줄여 주십시오.'
	};

	msg[rc.NOT_AUTHENTICATED] = '먼저 로그인 해주십시오.';
	msg[rc.NOT_AUTHORIZED] = '사용 권한이 없습니다.';
	msg[rc.INVALID_PASSWORD] = '비밀번호를 다시 확인해 주십시오.';

	msg[rc.INVALID_DATA] = '비정상적인 값이 입력되었습니다.';
	msg[rc.INVALID_CATEGORY] = '정상적인 카테고리가 아닙니다.';
	msg[rc.INVALID_THREAD] = '정상적인 글줄이 아닙니다.';
	msg[rc.INVALID_POST] = '정상적인 글이 아닙니다.';

});

init.add(function () {

	window.$window = $(window);
	window.$document = $(document);
	window.$content = $('#content');

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
