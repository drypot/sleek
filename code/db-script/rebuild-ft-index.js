
import * as init from '../base/init.js';
import * as config from '../base/config.js';
import * as db from '../db/db.js';
import * as expb from '../express/express-base.js';

import "../user/user-base";
import * as postsr from "../post/post-search";
import "../post/post-update";
import "../post/post-new";
import "../post/post-view";
import "../post/post-list";

init.add(
  (done) => {
    postsr.updateAll.showProgress = true;
    postsr.updateAll(done);
  },
  (done) => {
    db.close(done);
  },
  (done) => {
    console.log('done.');
    done();
  }
);

init.run();
