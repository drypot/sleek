if (!window.console) {
  window.console = {
    log: function () {}
  }
}

$(function () {
  window.error = {};

  function define(code, msg) {
    error[code] = {
      code: code,
      message: msg
    }
  }

  define('INVALID_DATA', '비정상적인 값이 입력되었습니다.');
  define('INVALID_FORM', '*');

  define('NOT_AUTHENTICATED', '먼저 로그인해 주십시오.');
  define('NOT_AUTHORIZED', '사용 권한이 없습니다.');

  // TODO: 아래 에러 코드 Mig.
  error.ERROR_SET = 10;

  error.NOT_AUTHENTICATED = 101;
  error.NOT_AUTHORIZED = 102;

  error.INVALID_DATA = 201;
  error.INVALID_CATEGORY = 202;
  error.INVALID_THREAD = 203;
  error.INVALID_POST = 204;
});

$(function () {
  window.dt = {};

  function pad(number) {
    var r = String(number);
    if ( r.length === 1 ) {
      r = '0' + r;
    }
    return r;
  }

  if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = function() {
      return this.getUTCFullYear()
        + '-' + pad( this.getUTCMonth() + 1 )
        + '-' + pad( this.getUTCDate() )
        + 'T' + pad( this.getUTCHours() )
        + ':' + pad( this.getUTCMinutes() )
        + ':' + pad( this.getUTCSeconds() )
        + '.' + String( (this.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 )
        + 'Z';
    };
  }

  utilp.toDateTimeString = function (d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  };

  var key = 'last-access-2';
  var now = dt.now = new Date();
  var lastSession, lastSessionStr;
  var lastAccess;
  var v;

  v = localStorage.getItem(key);
  lastAccess = v ? new Date(v) : now;

  v = sessionStorage.getItem(key);
  if (v) {
    lastSession = new Date(v);
    if (now.getTime() - lastAccess.getTime() > 30 * 60 * 1000) {
      lastSession = undefined;
    }
  }
  if (!lastSession) {
    lastSession = lastAccess;
    sessionStorage.setItem(key, lastAccess.toISOString());
  }

  lastSessionStr = utilp.toDateTimeString(lastSession);
  localStorage.setItem(key, now.toISOString());

  dt.isNew = function (d) {
    return d > lastSessionStr;
  };
});

$(function () {
window.$window = $(window);
  window.$document = $(document);

  window.url = {};
  window.url.pathnames = window.location.pathname.slice(1).split('/');
  window.url.query = (function () {
    var plusx = /\+/g;
    var paramx = /([^&=]+)=?([^&]*)/g;
    var search = window.location.search.slice(1);
    var query = {};
    var match;
    while (match = paramx.exec(search)) {
      query[match[1]] = decodeURIComponent(match[2].replace(plusx, ' '));
    }
    return query;
  })();
});

$(function () {

  var ping;

  $('textarea').on('focus', function () {
    if (!ping) {
      ping = true;
      console.log('ping: start');
      window.setInterval(function() {
        request.get('/api/hello').end(function (err, res) {
          if (err || res.error) {
            console.log('ping: error');
            return;
          }
          console.log('ping');
        });
      }, 1000 * 60 * 5); // 5 min
    }
  })

});
