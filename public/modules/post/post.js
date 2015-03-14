
init.add(function () {

  // Threads

  window.post = {};

  post.initThreadList = function () {
    $('.threads .d').each(function () {
      var $tar = $(this).closest('tr').find('a')
      var udateStr = $(this).text();
      if (dt.isNew(udateStr)) {
        $tar.removeClass('text-muted');
      }
    });
  };

  post.initThreadAndPosts = function () {

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

    var $1pat = /\$1/g;

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
        r += p.replace.replace($1pat, match[1]);
        a = match.index + match[0].length;
      }
      r += tagUpText(s.slice(a), pi + 1);
      return r;
    }

    var imgPattern = /.*\.(jpg|jpeg|gif|png)$/i;

    function handle() {
      return $('<button class="media-handle btn btn-mini btn-info">Show</button>');
    }

    var $posts = $('.posts');

    $posts.find('.text pre').each(function () {
      $(this).html(tagUpText($(this).html(), 0));
    });

    $posts.find('.file a').each(function () {
      var $this = $(this);
      if (imgPattern.test($this.attr('href'))) {
        $this.wrap('<span class="media-img"></span>');
      }
    });

    $posts.find('.media-img').after(
      handle().click(function () {
        var $handle = $(this);
        var $media = $handle.prev();
        if ($handle.text() === 'Show') {
          $handle.after(
            $('<div class="img"></div>').append(
              $('<img>', { src: $media.children('a').attr('href') })
            )
          );
          $handle.text('Hide');
        } else {
          $handle.next().remove();
          $handle.text('Show');
        }
      })
    );

    $posts.find('.media').after(
      handle().click(function () {
        var $handle = $(this);
        var $media = $handle.prev();
        if ($handle.text() === 'Show') {
          $handle.data("org-code", $media.text());
          $media.html($media.text());
          $handle.text('Hide');
        } else {
          $media.text($handle.data("org-code"));
          $handle.text('Show');
        }
      })
    );

    var $scrollTarget = (function () {
      var $target = null;
      $posts.find(".d").each(function() {
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

  post.initNewForm = function () {
    var $form = formty.getForm('#form');
    formty.initFileGroup($form, 'files');
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
      formty.post('/api/threads', $form, function (err) {
        if (err) return showError(err);
        localStorage.setItem('writer', $form.$writer.val());
        location = '/threads';
      });
      return false;
    });
  };

  post.initReplyForm = function () {
    var $form = formty.getForm('#form');
    formty.initFileGroup($form, 'files');
    $form.$writer.val(localStorage.getItem('writer') || '');
    $form.$send.click(function () {
      formty.post('/api/threads/' + url.pathnames[1], $form, function (err, res) {
        if (err) return showError(err);
        localStorage.setItem('writer', $form.$writer.val());
        location = '/threads/' + res.body.tid;
      });
      return false;
    });
  };

  post.initEditForm = function () {
    var $form = formty.getForm('#form');
    formty.initFileGroup($form, 'files');
    $form.$send.click(function () {
      formty.put('/api/threads/' + url.pathnames[1] + '/' + url.pathnames[2], $form, function (err, res) {
        if (err) return showError(err);
        location = '/threads/' + url.pathnames[1];
      });
      return false;
    });
  };

});
