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

  dt.toDateTimeString = function (d) {
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

  lastSessionStr = dt.toDateTimeString(lastSession);
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

$(function() {

  window.formty = {};

  var nameRe = /[^\[]+/;

  formty.getForm = function (sel) {
    var $form = $(sel);
    $form.find('input, textarea, select, button').each(function () {
      if (this.name) {
        var name = this.name.match(nameRe)[0];
        $form['$' + name] = $(this);
      }
    });
    return $form;
  };

  formty.toObject = function ($form) {
    var obj = {};
    $form.find('input, textarea, select').each(function () {
      if (this.name && !this.disabled) {
        var $this = $(this);
        var name = this.name.match(nameRe)[0];
        var braket = this.name.length != name.length;
        if (this.type == 'checkbox') {
          if (braket) {
            if ($this.prop('checked')) {
              if (obj[name]) {
                obj[name].push($this.val());
              } else {
                obj[name] = [$this.val()];
              }
            }
          } else {
            obj[name] = $this.prop('checked');
          }
          return;
        }
        if (this.type == 'file') {
          return;
        }
        obj[name] = $this.val();
      }
    });
    return obj;
  };

  formty.initFileGroup = function ($form, name) {
    var $fileTempl = $('#file-input-templ').children(0);
    var $fileTemplIE = $('#file-input-templ-msie').children(0);
    var $files = $form.find('.file-group .files');
    var $adder = $form.find('.file-group .glyphicon-plus');
    var basename = /[^\\]+$/;

    function addFileInput() {
      var $set = msie ? $fileTemplIE.clone(): $fileTempl.clone();

      var $file = $set.find('input[type="file"]');
      $file.attr('name', name);

      if (!msie) {
        var $text = $set.find('input[type="text"]');
        var $btn = $set.find('button');
        $btn.click(function () {
          $file.click();
          return false;
        });
        $file.on('change', function () {
          var files = $file[0].files;
          var text;
          if (files && files.length > 1) {
            text = files.length + ' files';
          } else {
            text = basename.exec($file.val())[0];
          }
          $text.val(text);
        });
      }
      $files.append($set);
    }

    addFileInput();
    $adder.click(function () {
      addFileInput();
      return false;
    });
  };

  formty.sendFiles = function ($form, done) {
    var files = $('input[type=file]', $form).filter(function () {
      return $(this).val();
    });
    if (files.length) {
      console.log('sending ' + files.length + ' files.');
      $.ajax('/upload', {
        dataType: 'json',
        method: 'POST',
        files: files,
        iframe: true,
        success: function(data, textStatus, jqXHR) {
          done(null, { body: data });
        },
        error:function (jqXHR, textStatus, errorThrown) {
          var err = {
            message: 'Uploading Error',
            detail: jqXHR.responseText
          };
          done(err);
        }
      });
      return;
    }
    done(null, { body: {} });
  };

  var methods = [ 'post', 'get', 'put', 'del' ];

  for (var i = 0; i < methods.length; i++) {
    var method = methods[i];
    formty[method] = (function (method) {
      return function (url, $form, done) {
        var form = formty.toObject($form);
        formty.clearAlerts($form);
        formty.showSending($form);
        formty.sendFiles($form, function (err, res) {
          if (err) return done(err);
          for (var key in res.body) {
            form[key] = res.body[key];
          }
          request[method].call(request, url).send(form).end(function (err, res) {
            err = err || res.error;
            if (err) return done(err);
            if (res.body.err) {
              if (res.body.err.rc === error.ERROR_SET) {
                formty.addAlerts($form, res.body.err.errors);
                formty.hideSending($form);
                return;
              }
              showError(res.body.err);
              formty.hideSending($form);
              return;
            }
            done(null, res);
          });
        });
      };
    })(method)
  }

  formty.showSending = function ($form) {
    var $send = $form.find('[name=send]');
    var $sending = $form.find('[name=sending]');
    if ($send.length && $sending.length) {
      $send.addClass('hide');
      $sending.removeClass('hide');
    }
  };

  formty.hideSending = function ($form) {
    var $send = $form.find('[name=send]');
    var $sending = $form.find('[name=sending]');
    if ($send.length && $sending.length) {
      $form.find('[name=send]').removeClass('hide');
      $form.find('[name=sending]').addClass('hide');
    }
  };

  formty.clearAlerts = function ($form) {
    $form.find('.alert').remove();
    $form.find('.has-error').removeClass('has-error');
    $form.find('.text-danger').remove();
  };

  formty.addAlert = function ($control, msg) {
    var $group = $control.closest('div');
    $group.addClass('has-error');
    //$control.before($('<div>').addClass('alert alert-danger').text(msg));
    $group.append($('<p>').addClass('error text-danger').text(msg));
  };

  formty.addAlerts = function ($form, fields) {
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      formty.addAlert($form.find('[name="' + field.name + '"]'), field.msg);
    }
  }

});

$(function() {

  var $modal = $('#error-modal');
  var $title = $modal.find('.modal-title');
  var $body = $modal.find('.modal-body');

  window.showError = function (err, done) {
    $title.empty();
    $title.append('<h3>시스템 오류</h3>');
    $body.empty();
    $body.append('<h3>Message</h3>');
    $body.append('<pre>' + err.message + '</pre>');
    if (err.stack) {
      $body.append('<h3>Stack</h3>');
      $body.append('<pre>' + err.stack + '</pre>');
    }
    if (err.detail) {
      $body.append('<h3>Detail</h3>');
      $body.append('<pre>' + err.detail + '</pre>');
    }
    $modal.off('hidden.bs.modal');
    if (done) {
      $modal.on('hidden.bs.modal', done);
    }
    $modal.modal('show');
  };

});

$(function () {

  $('.navbar .logout-btn').click(function () {
    session.logout();
    return false;
  });

  $('.navbar .new-btn').click(function () {
    if (url.query.c) {
      location='/threads/new?c=' + url.query.c;
    } else {
      location='/threads/new';
    }
    return false;
  });

//  if (url.query.q) {
//    $('.navbar input[name="q"]').val(url.query.q);
//  }
});

