let tokenizer = {};

tokenizer.word = function (article) {
    //TODO Dr. Mr.应该解析成整体的单词
    let tokens = [];
    const wordRegex = {
        chinese: /[\u2010-\uFFE5]/,
        english: /[a-zA-z]/
    };
    let letters = article.split('');
    for (let i = 0; i < letters.length; i++) {
        let word = '';
        let nextloop = true;
        if (letters[i] === '<') { //处理标签
            do {
                word += letters[i];
                if (i + 1 < letters.length) {
                    i++;
                    if (letters[i] === '>') {
                        word += letters[i];
                        nextloop = false;
                    }
                } else nextloop = false;
            } while (nextloop);
            tokens.push({a: 't', c: word});
        } else if (wordRegex.english.test(letters[i])) { //处理英文单词
            do {
                word += letters[i];
                if (i + 1 < letters.length
                    && (wordRegex.english.test(letters[i + 1]) || letters[i + 1] === '\'')) {
                    //处理don't，can't之类的，目前规则是，'之后必须还是字母，否则'当做符号处理
                    if (letters[i + 1] === '\'') {
                        if (i + 2 < letters.length && wordRegex.english.test(letters[i + 2])) i++;
                        else nextloop = false;
                    } else i++;
                } else {
                    nextloop = false;
                }
            } while (nextloop);
            tokens.push({a: 'w', c: word});
        } else if (wordRegex.chinese.test(letters[i])) { //处理中文
            do {
                word += letters[i];
                if (i + 1 < letters.length
                    && (wordRegex.chinese.test(letters[i + 1]))) {
                    i++;
                } else {
                    nextloop = false;
                }
            } while (nextloop);
            tokens.push({a: 'c', c: word});
        } else { //其它符号
            do {
                word += letters[i];
                if (i + 1 < letters.length
                    && !wordRegex.chinese.test(letters[i + 1])
                    && !wordRegex.english.test(letters[i + 1])
                    && letters[i + 1] !== '<') {
                    i++;
                } else {
                    nextloop = false;
                }
            } while (nextloop);
            tokens.push({a: 's', c: word});
        }
    }
    return (tokens);
};

tokenizer.sentence = function (article) {
    //TODO Dr. Mr.等带点的单词，会被错误得切分成句子
    let n = article.match(/[\"‘“\[\(\{⟨].*?[\"’”\]\)\}⟩]/g);
    if (n) {
        for (let i = 0; i < n.length; i++) {
            let value = n[i];
            if (/[\.\?\!][\"’”\]\)\}⟩]/.test(value)) {
                article = article.replace(value, `::${i}::~`);
            } else {
                article = article.replace(value, `::${i}::`);
            }
        }
    }
    let tokens = article.match(/[^\.\?\!~]+[\.\?\!\~]+\s?/g);
    let count = 0;
    if (n) {
        for (let i = 0; i < tokens.length; i++) {
            let nn = tokens[i].match(/::\d+::~?/g);
            if (nn) {
                nn.forEach(value => {
                    tokens[i] = tokens[i].replace(value, n[count]);
                    count++;
                });
            }
        }
    }
    if(!tokens) tokens = [article];
    return tokens;
};

tokenizer.paragraph = function (article) {
    return article.split(/\n\r?/);
};

module.exports = tokenizer;
