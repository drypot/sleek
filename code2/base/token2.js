
const token2 = exports;

// tokenzier

// stop words from lucene

var stops = [
  'a', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is', 'it', 'no', 'not',
  'of', 'on', 'or', 's', 'such', 't', 'that', 'the', 'their', 'then', 'there', 'these', 'they', 'this',
  'to', 'was', 'will', 'with', '', 'www'
];

var engx = /\w+/g
var unix = /[\u0100-\uffff]+/g

token2.tokenize = function () {
  var tokens = [];
  var len = arguments.length;
  for (var i = 0; i < len; i++) {
    tokenizeEng(arguments[i]);
    tokenizeUni(arguments[i]);
  }
  return Object.keys(tokens);

  function tokenizeEng(source) {
    var engs = source.match(engx);
    if (engs) {
      var len = engs.length;
      for(var i = 0; i < len; i++) {
        var word = engs[i].toLowerCase();
        if (~stops.indexOf(word)) {
          continue;
        }
        tokens[word] = true;
      }
    }
  }

  function tokenizeUni(source) {
    var unis = source.match(unix);
    if (unis) {
      var len = unis.length;
      for (var i = 0; i < len; i++) {
        var word = unis[i];
        var wordLen = word.length;
        if (wordLen == 1) {
          continue;
        }
        var prev = undefined;
        for (var j = 0; j < wordLen; j++) {
          var ch = word[j]
          if (!prev) {
            prev = ch;
            continue;
          }
          tokens[prev + ch] = true;
          prev = ch;
        }
      }
    }
  }
};
