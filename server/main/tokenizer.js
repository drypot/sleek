
// stop words from lucene

var stops = [
	'a', 'and', 'are', 'as', 'at', 'be',
	'but', 'by', 'for', 'if', 'in',
	'into', 'is', 'it', 'no', 'not',
	'of', 'on', 'or', 's', 'such', 't',
	'that', 'the', 'their', 'then',
	'there', 'these', 'they', 'this',
	'to', 'was', 'will', 'with', '',
	'www'
];


exports.tokenize = function () {
	var tokens = [];

	var len = arguments.length;
	for (var i = 0; i < len; i++) {
		tokenizeEngs(arguments[i], tokens);
		tokenizeUnis(arguments[i], tokens);
	}

	return Object.keys(tokens);
};

var engPattern = /\w+/g

function tokenizeEngs(source, tokens) {
	var engs = source.match(engPattern);
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

var uniPattern = /[\u0100-\uffff]+/g

function tokenizeUnis(source, tokens) {
	var unis = source.match(uniPattern);
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