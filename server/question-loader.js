const fs = require('fs');
const path = require('path');

function loadFile(filename) {
    const filepath = path.join(__dirname, `static/${filename}`);
    // Load the file
    const data = fs.readFileSync(filepath, 'UTF-8');
    // Split on newline chars
    const lines = data.split(/\r?\n/);

    // Trim all the lines
    lines.forEach((line, i) => {
        lines[i] = line.trim();
    });

    return lines;
}

function getQuestions() {
    let makeQuestions = (array) => {
        let questions = [];
        array.forEach((line) => {
            questions.push(new Question(line));
        });

        return questions;
    };

    return {
        appearance: makeQuestions(loadFile('appearance.txt')),
        interests: makeQuestions(loadFile('interests.txt'))
    }
}

function randomSelect(array, n = 1) {
    if (n > array.length) {
        throw `Cannot select ${n} elements from array with only ${array.length} elements.`;
    }
    if (n < 1) {
        throw `Cannot select less than 1 element`;
    }

    let unusedQuestions = array.filter(q => !q.used);

    n = unusedQuestions.length < n ? unusedQuestions.length : n;

    // Generate n unique random numbers
    let randomIndexes = [];
    while (randomIndexes.length < n) {
        let num = Math.floor(Math.random() * unusedQuestions.length);

        if (randomIndexes.includes(num)) {
            continue;
        }

        randomIndexes.push(num);
    }

    // Select the elements from the given array at each random index
    let selection = [];
    randomIndexes.forEach((i) => {
        selection.push(unusedQuestions[i]);
    });

    return selection;
}

class Question {
    constructor(text) {
        this.text = text;
        this.used = false;

        let listRegex = /\[[A-Z ]*]/;
        // this.hasOptions = regex.test(text);

        if (listRegex.test(text)) {
            this.hasOptions = 'optionList';
        }
        else if (/\{[A-Z ]*}/.test(text)) {
            this.hasOptions = 'freefill';
        }
        else {
            this.hasOptions = 'none';
        }

        if (this.hasOptions === 'optionList') {
            // convert variable in question from form [VARIABLE NAME] to variable-name
            let optionFileName = this.text.match(listRegex)[0];
            optionFileName = optionFileName.replace(/\[|\]/g, '').replace(/ /, '-').toLowerCase();

            // Load the file static/options/variable-name.txt
            try {
                this.options = loadFile(`options/${optionFileName}.txt`);
            }
            catch (err) {
                console.error(`No options file found for ${optionFileName}. ("${this.text}")`);
            }
        }
    }

    use() {
        this.used = true;
    }
}

class QuestionPooler {
    constructor(players = 2) {
        this.players = players;
        // this.waitingForAnswer = false;

        this.pools = [];
        for (let i = 0; i < players; i++) {
            // Add a new pool
            this.pools.push({
                current: 0,
                questions: getQuestions()
            });
        }
    }

    getNewQuestions(playerIndex, questionList, n = 3) {
        playerIndex = parseInt(playerIndex);
        if (playerIndex >= this.players || playerIndex < 0 || playerIndex === undefined) {
            throw `playerIndex ${playerIndex} was out of range. Player count: ${this.players}.`;
        }

        let currentPool = this.pools[playerIndex];

        let questionSelection = undefined;
        if (questionList === 'appearance') {
            questionSelection = randomSelect(currentPool.questions.appearance, n);
        }
        else if (questionList === 'interests') {
            questionSelection = randomSelect(currentPool.questions.interests, n);
        }

        if (questionSelection === undefined) {
            throw 'Unknown question list';
        }

        return questionSelection;
    }

    useQuestion(question, playerIndex) {
        if (question === undefined) {
            throw 'Question was undefined';
        }

        let currentPool = this.pools[playerIndex];
        for (let q of currentPool.questions.appearance) {
            if (q.text === question.text) {
                q.use();
                return;
            }
        }

        for (let q of currentPool.questions.interests) {
            if (q.text === question.text) {
                q.use();
                return;
            }
        }
    }

    getAll(playerIndex) {
        if (playerIndex >= this.players || playerIndex < 0 || playerIndex === undefined) {
            throw `playerIndex ${playerIndex} was out of range. Player count: ${this.players}.`;
        }

        return this.pools[playerIndex].questions;
    }
}

const NO_QUESTION = new Question("empty");

module.exports.Pooler = QuestionPooler;
module.exports.NO_QUESTION = NO_QUESTION;
module.exports.Question = Question;

////// EXAMPLE CODE: //////

// let qp = new QuestionPooler();

// for (let i = 0; i < 20; i++) {
//     let qs = qp.getNewQuestions(0);
//     console.log(qs);
//     console.log(`${i}: Got ${qs.length} questions back`);

//     if (qs.length <= 0) break;

//     qs[0].use();
//     console.log(`used question "${qs[0].text}"`);
// }

// console.log(qp.getAll(0).appearance[0].options);