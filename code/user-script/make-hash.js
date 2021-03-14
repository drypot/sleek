import crypto from "crypto";
import bcrypt from "bcryptjs";

const funcs = {
  sha256: function (s) {
    const buf = Buffer.from(s, 'ucs2');
    const hash = crypto.createHash('sha256');
    hash.update(buf);
    const d = hash.digest('base64');
    console.log(d);
  },
  bcrypt: function (s) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(s, salt);
    console.log(hash);
  }
};

let func = funcs.bcrypt;
const argv = process.argv;

if (argv.length === 2) {
  console.log('make-hash [-sha256|-bcrypt] ...');
  process.exit(0);
}

argv.forEach(function (s, index) {
  if (index < 2) {
    return;
  }
  if (s[0] === '-') {
    func = funcs[s.slice(1)];
    return;
  }
  func(s);
});

