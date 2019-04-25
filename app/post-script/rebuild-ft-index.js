'use strict';

const init = require('../base/init');
const config = require('../base/config');
const async2 = require('../base/async2');
const mysql2 = require('../mysql/mysql2');
const expb = require('../express/express-base');

require('../user/user-base');
require('../post/post-list');
require('../post/post-view');
require('../post/post-new');
require('../post/post-update');
const postsr = require('../post/post-search');

init.tail((done) => {
  async2.waterfall(
    (done) => {
      postsr.updateAll.showProgress = true;
      postsr.updateAll(done);
    },
    (done) => {
      mysql2.close(done);
    },
    (err) => {
      console.log('rebuilding done.');
      process.exit(0);
    }
  );  
});

init.run();
