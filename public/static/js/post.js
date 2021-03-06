$(function () {
  window.postl = {};

  postl.initList = function () {
    $('.threads .d').each(function () {
      var $tar = $(this).closest('tr').find('a')
      var udateStr = $(this).text();
      if (dt.isNew(udateStr)) {
        $tar.removeClass('text-muted');
      }
    });
  };

  postl.initNew = function () {
    var $form = formty.getForm('form.main');
    if (url.query.c) {
      $form.$cid.val(url.query.c);
    }
    $form.$writer.val(localStorage.getItem('writer') || '');
    if ($form.$writer.val()) {
      $form.$title.focus();
    } else {
      $form.$writer.focus();
    }
    $form.$send.click(function () {
      formty.post('/api/posts', $form, function () {
        localStorage.setItem('writer', $form.$writer.val());
        location = '/posts';
      });
      return false;
    });
  };

  postl.initReply = function () {
    var $form = formty.getForm('form.main');
    $form.$writer.val(localStorage.getItem('writer') || '');
    $form.$send.click(function () {
      formty.post('/api/posts/' + url.pathnames[1], $form, function (err, res) {
        localStorage.setItem('writer', $form.$writer.val());
        location = '/posts/' + res.body.tid;
      });
      return false;
    });
  };

  postl.initUpdate = function () {
    var $form = formty.getForm('form.main');
    $form.$send.click(function () {
      formty.put('/api/posts/' + url.pathnames[1] + '/' + url.pathnames[2], $form, function () {
        location = '/posts/' + url.pathnames[1];
      });
      return false;
    });
  };

  postl.initView = function () {

    var patterns = [
      { // iframe
        pattern: /(&lt;iframe.+?\/iframe&gt;)/gim,
        replace: '<span class="media">$1</span>'
      },
      { // object
        pattern: /(&lt;object.+?\/object&gt;)/gim,
        replace: '<span class="media">$1</span>'
      },
      { // embed
        pattern: /((?:&lt;embed.+?&gt;|&lt;\/embed&gt;)+)/gim,
        replace: '<span class="media">$1</span>'
      },
      {
        // img
        pattern: /(&lt;img\s.+?&gt;)/gi,
        replace: '<span class="media">$1</span>'
      },
      { // img url
        pattern: /(https?:\/\/[^ "'<>\n\r\)]+\.(jpg|jpeg|gif|png))(?=[\n ])/ig,
        replace: '<span class="media-img"><a href="$1" target="_blank">$1</a></span>'
      },
      { // url
        pattern: /(https?:\/\/[^ "'>)\n\r]+)/g,
        replace: '<a href="$1" target="_blank">$1</a>'
      }
    ];

    function tagUpText(s, pi) {
      if (pi == patterns.length) {
        return s;
      }
      var p = patterns[pi];
      var r = '';
      var a = 0;
      var match;
      while(match = p.pattern.exec(s)) {
        r += tagUpText(s.slice(a, match.index), pi + 1);
        r += p.replace.replace(/\$1/g, match[1]);
        a = match.index + match[0].length;
      }
      r += tagUpText(s.slice(a), pi + 1);
      return r;
    }

    var $posts = $('.posts');

    $posts.find('.text pre').each(function () {
      $(this).html(tagUpText($(this).html(), 0));
    });

    $posts.find('.file a').each(function () {
      var $this = $(this);
      if (/.*\.(jpg|jpeg|gif|png)$/i.test($this.attr('href'))) {
        $this.wrap('<span class="media-img"></span>');
      }
    });

    $posts.find('.media-img').after(
      $('<button class="media-show-btn btn btn-mini btn-info">Show</button>').click(function () {
        var $btn = $(this);
        var $media = $btn.prev();
        if ($btn.text() === 'Show') {
          $btn.after(
            $('<div class="img"></div>').append(
              $('<img>', { src: $media.children('a').attr('href') })
            )
          );
          $btn.text('Hide');
        } else {
          $btn.next().remove();
          $btn.text('Show');
        }
      })
    );

    $posts.find('.media').after(
      $('<button class="media-show-btn btn btn-mini btn-info">Show</button>').click(function () {
        var $btn = $(this);
        var $media = $btn.prev();
        if ($btn.text() === 'Show') {
          $btn.data('org-code', $media.text());
          $media.html($media.text());
          $btn.text('Hide');
        } else {
          $media.text($btn.data('org-code'));
          $btn.text('Show');
        }
      })
    );

    var $scrollTarget = (function () {
      var $target = null;
      $posts.find('.d').each(function() {
        var cdateStr = $(this).text();
        if (dt.isNew(cdateStr)) {
          $target = $(this);
          return false;
        }
      });
      return $target;
    })();

    if ($scrollTarget) {
      var ey = Math.round(Math.max($scrollTarget.offset().top - ($window.height() / 4), 0));
      $('body, html').animate({ scrollTop: ey }, 200);
    }
  };
});
