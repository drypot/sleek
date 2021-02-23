'use strict';

const init = require('../base/init');
const config = require('../base/config');
const expb = require('../express/express-base');
const mysql2 = require('../mysql/mysql2');

require('../user/user-base');
require('../post/post-list');
require('../post/post-view');
require('../post/post-new');
require('../post/post-update');
require('../post/post-search');

process.on('SIGINT', function() {
  mysql2.close(function(err) {
    console.log("SIGINT caught");
    process.exit(err ? 1 : 0);
  });
});

init.add((done) => {
  expb.start();
  done();
});

init.run();

