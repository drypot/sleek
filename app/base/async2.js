'use strict';

const async2 = exports;

async2.if = function (condi, f1, f2, f3) {
  if (f3) {
    if (condi) {
      f1(f3);
    } else {
      f2(f3);
    }
  } else {
    if (condi) {
      f1(f2);
    } else {
      f2();
    }    
  }
};