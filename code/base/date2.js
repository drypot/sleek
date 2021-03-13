
export function today() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function dateFromString(s) {
  const d = new Date(s);
  d.setHours(0, 0, 0, 0);
  return d;
}

function pad(number) {
  let r = String(number);
  if ( r.length === 1 ) {
    r = '0' + r;
  }
  return r;
}

export function dateTimeString(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
    pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

export function dateString(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

export function dateStringNoDash(d) {
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
}
