var request = superagent;

var l = {};

l.rc = {
	SUCCESS: 0,

	NOT_AUTHENTICATED: 101,
	NOT_AUTHORIZED: 102,
	INVALID_PASSWORD: 103,

	INVALID_DATA: 201,
	INVALID_CATEGORY: 202,
	INVALID_THREAD: 203,
	INVALID_POST: 204,

	DB_IO_ERR: 301,
	FILE_IO_ERR: 302,
	SEARCH_IO_ERR: 303
};

l.msg = {
	FILL_TITLE: '제목을 입력해 주십시오.',
	SHORTEN_TITLE: '제목을 줄여 주십시오.',
	FILL_WRITER: '필명을 입력해 주십시오.',
	SHORTEN_WRITER: '필명을 줄여 주십시오.'
};

l.rcMsg = [];

l.rcMsg[l.rc.NOT_AUTHENTICATED] = '먼저 로그인 해주십시오.';
l.rcMsg[l.rc.NOT_AUTHORIZED] = '로그인 후 사용하실 수 있습니다.';
l.rcMsg[l.rc.INVALID_PASSWORD] = '비밀번호를 다시 확인해 주십시오.';

l.rcMsg[l.rc.INVALID_DATA] = '비정상적인 값이 입력되었습니다.';
l.rcMsg[l.rc.INVALID_CATEGORY] = '정상적인 카테고리가 아닙니다.';
l.rcMsg[l.rc.INVALID_THREAD] = '정상적인 글줄이 아닙니다.';
l.rcMsg[l.rc.INVALID_POST] = '정상적인 글이 아닙니다.';

l.rcMsg[l.rc.DB_IO_ERR] = '데이터베이스와의 연결에 문제가 발생하였습니다.';
l.rcMsg[l.rc.FILE_IO_ERR] = '파일 처리에 문제가 발생하였습니다.';
l.rcMsg[l.rc.SEARCH_IO_ERR] = '검색 서버와의 연결에 문제가 발생하였습니다.';

(function () {

	l.isObject = function (obj) {
		return Object.prototype.toString.call(obj) === '[object Object]';
	};

	l.def = function (obj, prop, def) {
		if (!obj) return def;
		if (!_.has(obj, prop)) return def;
		return obj[prop];
	};

	l.defInt = function (obj, prop, def, min, max) {
		if (!obj) return def;
		if (!_.has(obj, prop)) return def;
		var i = parseInt(obj[prop]);
		if (isNaN(i)) return def;
		if (min === undefined) return i;
		return i > max ? max : i < min ? min : i;
	};

	l.defString = function (obj, prop, def) {
		if (!obj) return def;
		if (!_.has(obj, prop)) return def;
		return String(obj[prop]).trim();
	};

	l.defBool = function (obj, prop, def) {
		if (!obj) return def;
		if (!_.has(obj, prop)) return def;
		var v = obj[prop];
		return v === true || v === 'true';
	};

	l.mergeProperty = function (tar, src, props) {
		_.each(props, function (p) {
			if (src.hasOwnProperty(p)) {
				tar[p] = src[p];
			}
		});
		return tar;
	}

	if (!String.prototype.trim) {
		String.prototype.trim = function() {
			return this.replace(/^\s+|\s+$/g, '');
		};
	}

	// http://stove99.tistory.com/46

	Date.prototype.format = function(f) {
		if (!this.valueOf()) return " ";

		var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
		var d = this;

		return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
			switch ($1) {
				case "yyyy": return d.getFullYear();
				case "yy": return (d.getFullYear() % 1000).zf(2);
				case "MM": return (d.getMonth() + 1).zf(2);
				case "dd": return d.getDate().zf(2);
				case "E": return weekName[d.getDay()];
				case "HH": return d.getHours().zf(2);
				case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
				case "mm": return d.getMinutes().zf(2);
				case "ss": return d.getSeconds().zf(2);
				case "a/p": return d.getHours() < 12 ? "오전" : "오후";
				default: return $1;
			}
		});
	};

	String.prototype.string = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
	String.prototype.zf = function(len){return "0".string(len - this.length) + this;};
	Number.prototype.zf = function(len){return this.toString().zf(len);};

})();


(function () {

	l.init = {};

	var initList = [];
	var beforeList = [];
	var afterList = [];

	reset();

	l.init.reset = reset;

	function reset() {
		initList = [];
		beforeList = [];
		afterList = [];
	}

	l.init.init = function init(func) {
		return add(initList, func);
	};

	l.init.beforeInit = function (func) {
		return add(beforeList, func);
	};

	l.init.afterInit = function (func) {
		return add(afterList, func);
	};

	function add(list, func) {
		list.push(func);
	}

	l.init.run = function (next) {
		var all = beforeList.concat(initList, afterList);
		var i = 0, len = all.length;
		while (i < len) {
			all[i]();
			i++;
		}
	};

	$(function () {
		l.init.run();
	});

})();

l.init.beforeInit(function () {

	// global var

	l.$window = $(window);
	l.$document = $(document);
	l.$content = $('#content');

	l.url = URI(location.toString());
	l.query = l.url.query(true);

});


l.init.init(function() {

	// error dialog

	var $modal;

	l.modalError = function (header, text) {
		if (!$modal) {
			$modal = $('#error-modal');
		}
		$modal.find('h3').html(header);
		$modal.find('p').html(text);
		$modal.modal('show');
	};

	l.systemModalError = function (text) {
		l.modalError("시스템 오류", text);
	};

});

// TODO: sessionStore 검사해서 IE 7 사용자에게 안내 의우기

l.init.init(function () {

	l.menu = {};

	var $menu = $('.navbar');
	var $logout = $menu.find('a[href="/logout"]');

	$logout.click(function () {
		l.session.logout();
		return false;
	});

	l.menu.update = function () {
		if (l.session.role) {
			$logout.parent().css('display', 'block');
		} else {
			$logout.parent().css('display', 'none');
		}
	}

})

l.init.init(function () {

	l.category = {};

	l.category.update = function (categoryId) {
		var $category = $('#category');
		if (!l.session.role) {
			//
		} else {
			var html = [];
			var sep = false;
			html.push('<ul class="nav nav-list">');
			_.each(l.session.role.categoryList, function (c) {
				if (sep) {
					html.push('<li class="divider"></li>');
					sep = false;
				}
				if (c.id === categoryId) {
					html.push('<li class="active">');
				} else {
					html.push('<li>');
				}
				html.push('<a href="/thread');
				html.push(c.id === 0 ? '' : '?c=' + c.id);
				html.push('">');
				html.push(c.name);
				html.push('</a></li>');
				if (c.sep) {
					sep = true;
				}
			});
			html.push('</ul>');
			$category.removeClass('hidden');
			$category.empty().html(html.join(''));
		}
	};

});

l.init.init(function () {

	l.form = {};

	l.form.clearAlert = function ($content) {
		$content.find('.alert').remove();
		$content.find('.error').removeClass('error');
	};

	l.form.addAlert = function ($control, msg) {
		var $alert = $('<div>').addClass('alert alert-error').text(msg);
		$control.parent().addClass('error');
		$control.parent().before($alert);
	};

});

l.init.init(function () {

	// superagent

	request.Request.prototype.endEx = function(fn){
		this.end(function(res){
			if(res.ok){
				fn(null, res);
			} else {
				fn(res.text, res);
			}
		});
	};

	// add array.reduce for superagent, remove when superagent be patched

	if (!Array.prototype.reduce) {
		Array.prototype.reduce = function reduce(accumulator){
			if (this===null || this===undefined) throw new TypeError("Object is null or undefined");
			var i = 0, l = this.length >> 0, curr;

			if(typeof accumulator !== "function") // ES5 : "If IsCallable(callbackfn) is false, throw a TypeError exception."
				throw new TypeError("First argument is not callable");

			if(arguments.length < 2) {
				if (l === 0) throw new TypeError("Array length is 0 and no second argument");
				curr = this[0];
				i = 1; // start accumulating at the second element
			}
			else
				curr = arguments[1];

			while (i < l) {
				if(i in this) curr = accumulator.call(undefined, curr, this[i], i, this);
				++i;
			}

			return curr;
		};
	}

});

l.init.init(function () {

	l.spinner = new Spinner({
		lines: 11, // The number of lines to draw
		length: 5, // The length of each line
		width: 2, // The line thickness
		radius: 6, // The radius of the inner circle
		rotate: 0, // The rotation offset
		color: '#000', // #rgb or #rrggbb
		speed: 1, // Rounds per second
		trail: 60, // Afterglow percentage
		shadow: false, // Whether to render a shadow
		hwaccel: false, // Whether to use hardware acceleration
		className: 'spinner', // The CSS class to assign to the spinner
		zIndex: 2e9, // The z-index (defaults to 2000000000)
		top: 'auto', // Top position relative to parent in px
		left: 'auto' // Left position relative to parent in px
	});

});

l.init.init(function () {

	l.ping = function () {
		$.post("/ping");
	};

	l.pingPingPing = function () {
		window.setInterval(function() { $.post("/ping") }, 1000 * 60 * 5)
	};

});

l.init.init(function () {
	jQuery.fn.attachScroller = function(callback) {
		var target = this;
		var y = 0;
		var ny = 0;
		var timer = null;

		function scroll() {
			var scrollTop = document.documentElement.scrollTop + document.body.scrollTop;
			var dy = y - scrollTop;
			var ay = Math.max(Math.abs(Math.round(dy * 0.15)), 1) * (dy < 0 ? -1 : 1);
			clearTimeout(timer);
			if (Math.abs(dy) > 3 && Math.abs(ny - scrollTop) < 3) {
				ny = scrollTop + ay;
				scrollTo(0, ny);
				timer = setTimeout(scroll, 10);
			} else {
				if (callback) callback();
			}
		}

		var viewportHeight = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight;
		y = target.offset().top;
		y = y - (viewportHeight / 4);
		y = Math.round(Math.max(y, 0));
		timer = setTimeout(scroll, 0);
	}

});

l.init.beforeInit(function () {

	l.Tag = function () {
		this.buf = [];
	};

	var tag = l.Tag.prototype;

	tag.open = function (tag) {
		var buf = this.buf;
		var textExists = arguments.length % 2 == 0;
		buf.push('<');
		buf.push(tag);
		var l = textExists ? arguments.length - 1 : arguments.length;
		for(var i = 1; i < l; i++) {
			buf.push(' ');
			buf.push(arguments[i]);
			buf.push('="');
			i++;
			buf.push(arguments[i]);
			buf.push('"')
		}
		buf.push('>');
		if (textExists) {
			this.escape(arguments[l]);
			this.close(tag);
		}
		return this;
	};

	// img, br 같은 closing 없는 태그 때문에 인자 없는 close 는 어렵다.
	tag.close = function (tag) {
		var buf = this.buf;
		buf.push('</');
		buf.push(tag);
		buf.push('>');
		return this;
	};

	tag.escape = function (text) {
		this.buf.push(_.escape(text));
		return this;
	}

	tag.notEscape = function (text) {
		this.buf.push(text);
		return this;
	}

	tag.toString = function () {
		return this.buf.join('');
	}

});
