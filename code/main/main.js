import * as assert2 from "../base/assert2.js";
import * as init from '../base/init.js';
import * as config from '../base/config.js';
import * as expb from '../express/express-base.js';
import * as db from '../db/db.js';

import "../post/post-search";
import "../post/post-update";
import "../post/post-new";
import "../post/post-view";
import "../post/post-list";
import "../user/user-base";

process.on('SIGINT', function() {
  db.close(function(err) {
    console.log("SIGINT caught");
    process.exit(err ? 1 : 0);
  });
});

init.add((done) => {
  expb.start();
  done();
});

init.run();

