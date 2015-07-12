$(function () {
  window.userl = {};

  userl.initLogin = function () {
    var $form = formty.getForm('form.main');
    $form.$password.focus();
    $form.$send.click(function () {
      formty.post('/api/users/login', $form, function () {
        location = '/posts';
      });
      return false;
    });
  };

  userl.logout = function () {
    request.post('/api/users/logout').end(function (err, res) {
      err = err || res.body.err;
      if (err) return showError(err);
      console.log('logged out');
      location = '/';
    });
  };
});

$(function () {
  $('#logout-btn').click(function () {
    userl.logout();
    return false;
  });
});
