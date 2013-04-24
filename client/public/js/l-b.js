var request = superagent;

var l = {};

(function () {

	var space = /^\s+|\s+$/g;

	if (!String.prototype.trim) {
		String.prototype.trim = function() {
			return this.replace(space, '');
		};
	}

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

	// global var

	l.$window = $(window);
	l.$document = $(document);
	l.$content = $('#content');

//	l.url = URI(location.toString());
//	l.query = l.url.query(true);

})();

l.init(function() {

	// error dialog

	var $modal;

	l.error = function (header, text) {
		if (!$modal) {
			$modal = $('#error-modal');
		}
		$modal.find('h3').html(header);
		$modal.find('p').html(text);
		$modal.modal('show');
	};

	l.systemError = function (err) {
		l.error("시스템 오류", err);
	};

	l.unhandledError = function (rc) {
		l.error("발생해서는 안 되는 오류", '' + rc + ':' + l.rcMsg[rc]);
	};

});


l.init(function () {

	l.menu = {};

	$('.navbar a[href="/logout"]').click(function () {
		l.session.logout();
		return false;
	});

});

l.init(function () {

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

l.init(function () {

	// http://ejohn.org/blog/simple-javascript-inheritance/

	var initializing = false,
		superPattern = /xyz/.test(function () { xyz; }) ? /\b_super\b/ : /.*/;

	Object.subClass = function (properties) {
		var _super = this.prototype;

		initializing = true;
		var proto = new this();
		initializing = false;

		for (var name in properties) {
			proto[name] = typeof properties[name] == "function" &&
				typeof _super[name] == "function" &&
				superPattern.test(properties[name]) ?
				(function (name, fn) {
					return function () {
						var tmp = this._super;
						this._super = _super[name];
						var ret = fn.apply(this, arguments);
						this._super = tmp;
						return ret;
					};
				})(name, properties[name]) :
				properties[name];
		}

		function Class() {
			// All construction is actually done in the init method
			if (!initializing && this.init)
				this.init.apply(this, arguments);
		}

		Class.prototype = proto;
		Class.constructor = Class;
		Class.subClass = arguments.callee;
		return Class;
	}
});

l.init(function () {

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

});

l.init(function () {

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

l.init(function () {

	l.ping = function () {
		request.get('/api/hello').end();
	};

	l.pingPingPing = function () {
		window.setInterval(function() { request.get('/api/hello').end(); }, 1000 * 60 * 5); // 5 분마다 핑
	};

});

l.init(function () {

	// TODO:

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
