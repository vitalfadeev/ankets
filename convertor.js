// lexe
// parse
// convert

// Вопрос
// -Ответ
// -Ответ
// - Ответ
// vОтвет Отмеченный
// vОтвет Помеченый Это важно!

//
var CHECKMARK = 'v';

//
var LexType = {
    UNDEFINED: 0,
    QUESTION: 1,
    ANSWER: 2,
    BLANK: 3
};

// Lex
function Lex(ltype, s, pos) {
    this.type = ltype;
    this.s = s;
    this.pos = pos;
};

// Lexer
// line
// - ansver
// - ansver
// - ansver
// BLANK
function ILexer() {}

ILexer.prototype.lexe = function(text) {
    var state = LexType.UNDEFINED;
    var i = 0;
    var ch = '';

    // get lines
    var lines = this.get_lines(text);
    var line = "";
    var ltype = LexType.UNDEFINED;

    // storage buffer
    var lexems = [];

    //
    while (i < lines.length) {
        line = lines[i];
        ltype = this.get_line_type(line);

        switch (state) {
            case LexType.UNDEFINED:
                if (ltype == LexType.BLANK) {
                    // blank
                    lexems.push(new Lex(LexType.BLANK, line, i));
                    i++;

                } else {
                    // 1st alwys question
                    state = LexType.QUESTION;
                    lexems.push(new Lex(LexType.QUESTION, line, i));
                    i++;
                }
                break;

            case LexType.QUESTION:
                if (ltype == LexType.BLANK) {
                    // blank. reset to undefined
                    state = LexType.UNDEFINED;
                    lexems.push(new Lex(LexType.BLANK, line, i));
                    i++;

                } else
                if (ltype == LexType.ANSWER) {
                    state = LexType.ANSWER;
                    lexems.push(new Lex(LexType.ANSWER, line, i));
                    i++;

                } else
                if (ltype == LexType.QUESTION) {
                    // reset
                    state = LexType.UNDEFINED;

                } else {
                    throw "Unsupported lexem: " + ltype;
                }
                break;

            case LexType.ANSWER:
                if (ltype == LexType.BLANK) {
                    // skip blank
                    // reset to undefined
                    state = LexType.UNDEFINED;
                    lexems.push(new Lex(LexType.BLANK, line, i));
                    i++;

                } else
                if (ltype == LexType.ANSWER) {
                    //
                    lexems.push(new Lex(LexType.ANSWER, line, i));
                    i++;

                } else
                if (ltype == LexType.QUESTION) {
                    // recheck
                    state = LexType.QUESTION;

                } else {
                    throw "Unsupported lexem: " + ltype;
                }
                break;

            default:
                throw "Unsupported";
        }
    }

    return lexems;
};

ILexer.prototype.get_line_type = function(line) {
    var state = LexType.UNDEFINED;
    var pos = 0;
    var ch = '';

    //
    if (line.length == 0) {
        return LexType.BLANK;
    }

    //
    while (pos < line.length) {
        ch = line.substring(pos, pos+1);

        switch (state) {
            case LexType.UNDEFINED:
                if (ch == ' ') {
                    state = LexType.BLANK;
                    pos++;

                } else
                if (ch == '-') {
                    state = LexType.ANSWER;
                    return state;

                } else
                if (ch == CHECKMARK) { // checked answer
                    state = LexType.ANSWER;
                    return state;

                } else {
                    state = LexType.QUESTION;
                    return state;
                }
                break;

            case LexType.BLANK:
                if (ch == ' ') {
                    pos++;

                } else
                if (ch == '-') {
                    state = LexType.ANSWER;
                    return state;

                } else
                if (ch == CHECKMARK) { // checked answer
                    state = LexType.ANSWER;
                    return state;

                } else {
                    state = LexType.ANSWER;
                    return state;
                }
                break;

            default:
                throw "Unsupported";
        }
    }

    return state;
};

ILexer.prototype.get_lines = function(text) {
    var lines = text.split('\n');
    return lines;
};

// Storage
function Storage() {
    this.questions = [];
};

// Question
function Question(s, pos, answers) {
    this.s = s;
    this.pos = pos;
    this.answers = answers;
};

// Answer
function Answer(s, pos, is_checked) {
    this.s = s;
    this.pos = pos;
    this.is_checked = is_checked;
};

// Blank
function Blank(s, pos) {
    this.s = s;
    this.pos = pos;
}

// Parser
function IParser() {}

IParser.prototype.parse = function(lexems) {
    var i = 0;

    // questino
    //   - answer
    //   - answer
    //   v- checked answer
    //   !v- checked answer (imprtant!)
    //   !- checked answer (imprtant!)
    //   !!- checked answer (imprtant!!)
    var storage = new Storage();

    storage.questions = this.get_questions(lexems, i);

    return storage;
};

IParser.prototype.get_questions = function(lexems, i) {
    var questions = [];

    //
    while (i < lexems.length) {
        lex = lexems[i];

        switch (lex.type) {
            case LexType.QUESTION:
                var res = this.get_question(lex, lexems, i);
                questions.push( res.question );
                i = res.newpos;
                break;

            default:
                throw "Unsupported";
        }
    }

    return questions;
};

IParser.prototype.get_question = function(lex, lexems, i) {
    var q = new Question(lex.s, lex.pos, []);
    i++;

    // add answers
    while (i < lexems.length) {
        var lex = lexems[i];

        switch (lex.type) {
            case LexType.ANSWER:
                var res = this.get_answer(lex, lexems, i);
                q.answers.push( res.answer );
                i = res.newpos;
                break;

            case LexType.BLANK:
                var res = this.get_blank(lex, lexems, i);
                q.answers.push( res.blank );
                i = res.newpos;
                break;

            default:
                //throw "Unsupported lexem: " + lex.type + ": " + lex.s;
                return {question:q, newpos:i};
        }
    }

    return {question:q, newpos:i};
};

IParser.prototype.get_answer = function(lex, lexems, i) {
    var is_checked = this.detect_is_checked(lex.s);
    var s = lex.s;

    if (is_checked) {
        s = this.remove_checkmarks(s);
    }

    var a = new Answer(s, lex.pos, is_checked);
    i++;

    return {answer:a, newpos:i};
};

IParser.prototype.detect_is_checked = function(s) {
    var pos = 0;
    var ch = '';

    //
    if (s.length == 0) {
        return false;
    }

    //
    while (pos < s.length) {
        ch = s.substring(pos, pos+1);

        if (ch == ' ') {
            // skip spaces
            pos++;

        } else
        if (ch == '-') {
            // answer mark. no more
            return false;

        } else
        if (ch == CHECKMARK) {
            // checked!
            return true;

        } else {
            return false;
        }
    }

    return false;
};

IParser.prototype.remove_checkmarks = function(line) {
    var pos = 0;
    var ch = '';
    var result = '';

    //
    if (line.length == 0) {
        return line;
    }

    //
    while (pos < line.length) {
        ch = line.substring(pos, pos+1);

        if (ch == ' ') {
            result += ch;
            pos++;

        } else
        if (ch == '-') {
            result += line.substring(pos, line.length);
            return result;

        } else
        if (ch == CHECKMARK) {
            // skip
            pos++;

        } else {
            result += line.substring(pos, line.length);
            return result;
        }
    }

    return result;
};

IParser.prototype.get_blank = function(lex, lexems, i) {
    var b = new Blank(lex.s, lex.pos);
    i++;

    return {blank:b, newpos:i};
};


// ICheckersBuilder
function ICheckersBuilder() {}

ICheckersBuilder.prototype.build = function(storage) {
    return this.build_questions(storage.questions);
};

ICheckersBuilder.prototype.build_questions = function(questions) {
    var htmls = [];
    var html = "";

    for(var i=0; i < questions.length; i++) {
        html = this.build_question( questions[i] );
        htmls.push(html);
    };

    return htmls.join("\n");
}

ICheckersBuilder.prototype.build_question = function(question) {
    var htmls = [];
    var html = "";

    html = `
                <div class="mb-3">
                    <label>` + question.s + `</label>
            `;
    htmls.push(html);

    html = this.build_answers(question.answers);
    htmls.push(html);

    html = `
                </div>
            `;
    htmls.push(html);

    return htmls.join("\n");
};

ICheckersBuilder.prototype.build_answers = function(answers) {
    var htmls = [];
    var html = "";

    for(var i=0; i < answers.length; i++) {
        if (answers[i] instanceof Answer) {
            html = this.build_answer( answers[i] );

        } else
        if (answers[i] instanceof Blank) {
            html = this.build_blank( answers[i] );

        } else {
            throw "Unsupported";
        }

        htmls.push(html);
    };

    return htmls.join("\n");
}

ICheckersBuilder.prototype.build_answer = function(answer) {
    var htmls = [];
    var html = "";

    var id = "pos-" + answer.pos;

    html = `
                    <div class="custom-control custom-checkbox">
                      <input type="checkbox" class="custom-control-input" id="` + id + `" ` + (answer.is_checked ? 'checked' : '') + `>
                      <label class="custom-control-label" for="` + id + `">` + answer.s + `</label>
                    </div>
            `;
    htmls.push(html);

    return htmls.join("\n");
};

ICheckersBuilder.prototype.build_blank = function(blank) {
    return '';
}

// ITextBuilder
function ITextBuilder() {}

ITextBuilder.prototype.build = function(text, pos, is_checked) {
    pos = Number(pos);

    var lines = this.get_lines(text);

    if (is_checked) {
        lines[pos] = CHECKMARK + lines[pos];

    } else {
        lines[pos] = this.remove_checkkmark(lines[pos]);
    }

    return lines.join("\n");
}

ITextBuilder.prototype.get_lines = function(text) {
    var lines = text.split('\n');
    return lines;
};

ITextBuilder.prototype.remove_checkkmark = function(line) {
    var pos = 0;
    var ch = '';
    var result = '';

    //
    if (line.length == 0) {
        return line;
    }

    //
    while (pos < line.length) {
        ch = line.substring(pos, pos+1);

        if (ch == ' ') {
            result += ch;
            pos++;

        } else
        if (ch == '-') {
            result += line.substring(pos, line.length);
            return result;

        } else
        if (ch == CHECKMARK) {
            // skip
            pos++;

        } else {
            result += line.substring(pos, line.length);
            return result;
        }
    }

    return result;
};


// GET https://docs.google.com/forms/d/e/1FAIpQLSf382b1btFR2LMpPfVTxzL_KUgG33lL_cr_7uvwJbdxb-Cezg/viewform?usp=sf_link
// POST https://docs.google.com/forms/d/e/1FAIpQLSf382b1btFR2LMpPfVTxzL_KUgG33lL_cr_7uvwJbdxb-Cezg/formResponse
