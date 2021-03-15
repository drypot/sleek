import * as assert2 from "../base/assert2.js";
import * as init from '../base/init.js';
import * as config from '../base/config.js';
import * as expb from '../express/express-base.js';
import * as db from '../db/db.js';

import "../post/post-search.js";
import "../post/post-update.js";
import "../post/post-new.js";
import "../post/post-view.js";
import "../post/post-list.js";
import "../user/user-base.js";

// 2021-03-16
// pm2 에서 *.js 파일은 es 모듈로 인식하지 못한다.
// 이 문제를 해결하기 위해 main.js를 main.mjs로 변경.
//

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

