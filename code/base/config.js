import fs from "fs";
import minimist from "minimist";
import * as init from "../base/init.js";

export const prop = {};

let path = null;

export function setPath(_path) {
  path = _path;
}

init.add((done) => {
  prop.dev = process.env.NODE_ENV != 'production';
  prop.argv = minimist(process.argv.slice(2));
  const epath = path || prop.argv.config || prop.argv.c;
  if (typeof epath == 'string') {
    console.log('config: path=' + epath);
    fs.readFile(epath, 'utf8', function (err, data) {
      if (err) return done(err);
      const _config = JSON.parse(data);
      for(let p in _config) {
        prop[p] = _config[p];
      }
      done();
    });
  } else {
    process.stdout.write('config file not found.\n');
    process.stdout.write('\n');
    process.stdout.write('node some.js --config config.json\n');
    process.stdout.write('node some.js -c config.json\n');
    process.exit(-1);
  }
});
