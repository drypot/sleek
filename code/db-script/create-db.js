
import * as init from '../base/init.js';
import * as error from '../base/error.js';
import * as config from '../base/config.js';
import * as async2 from "../base/async2.js";
import * as db from '../db/db.js';
import * as expb from '../express/express-base.js';
import * as postb from "../post/post-base.js";
import * as userb from "../user/user-base.js";

db.setDropDatabase(true);

init.add((done) => {
  db.close(done);
});

init.run();
