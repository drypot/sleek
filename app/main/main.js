'use strict';

const init = require('../base/init');
const config = require('../base/config');
const expb = require('../express/express-base');

require('../user/user-base');
require('../post/post-list');
require('../post/post-view');
require('../post/post-new');
require('../post/post-update');
require('../post/post-search');

init.run(function (err) {
  if (err) throw err;
});
