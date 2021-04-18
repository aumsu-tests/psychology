/*  Copyright 2021 Maksim Peskov and Andrey Zakharchenko

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

let TestData;

let global_wrapper;
let start_screen;

let org_select;
let grp_select_container;
let grp_select;
let gender_select;

let gender = "";

let test_choose_screen;

let test_buttons;

let test_start_screen;
let current_test_title;

let test_question_screen;

let current_test;
let current_question = 1;

let percents;
let time;
let current_question_text;

let previous_question_button;
let next_question_button;

let finish_test_button;

let test_finish_screen;
let return_to_start_screen_button;

let yes_button;
let no_button;

let simple_answers_section;
let extended_answers_section;

let answer_no_button;
let answer_almost_no_button;
let answer_neutral_button;
let answer_almost_yes_button;
let answer_yes_button;

let timer_id;
let time_remain = 0;

let finished_tests = [];

$(document).ready(function() {
    TestData = GetData();

    global_wrapper = $("#global-wrapper");

    start_screen = $("#start-screen");
    test_choose_screen = $("#test-choose-screen");
    test_start_screen = $("#test-start-screen");
    current_test_title = $("#current-test-title");

    test_question_screen = $("#test-question-screen");

    percents = $("#percents");
    time = $("#time");
    current_question_text = $("#current-question");

    previous_question_button = $("#previous-question-button");
    next_question_button = $("#next-question-button");
    previous_question_button.click(() => previous_question());
    next_question_button.click(() => next_question());

    finish_test_button = $("#finish-test-button");
    finish_test_button.click(() => finish_test(true, false));

    test_finish_screen = $("#test-finish-screen");

    return_to_start_screen_button = $("#return-to-start-screen-button");
    return_to_start_screen_button.click(() => return_to_test_selection_screen());

    org_select = $("#organization-select");
    grp_select = $("#group-select");
    grp_select_container = $("#group-select-container");
    gender_select = $("#gender-select");

    test_buttons = $("#test-buttons");

    yes_button = $("#yes-button");
    no_button = $("#no-button");
    yes_button.click(() => click_answer("yes"));
    no_button.click(() => click_answer("no"));

    simple_answers_section = $("#simple-answers");
    extended_answers_section = $("#extended-answers");

    answer_no_button = $("#answer-no-button");
    answer_almost_no_button = $("#answer-almost-no-button");
    answer_neutral_button = $("#answer-neutral-button");
    answer_almost_yes_button = $("#answer-almost-yes-button");
    answer_yes_button = $("#answer-yes-button");
    answer_no_button.click(() => click_answer("no"));
    answer_almost_no_button.click(() => click_answer("almost_no"));
    answer_neutral_button.click(() => click_answer("neutral"));
    answer_almost_yes_button.click(() => click_answer("almost_yes"));
    answer_yes_button.click(() => click_answer("yes"));


    org_select.html(create_org_list(TestData.orgs));
    grp_select.html(create_grp_list(TestData.orgs[org_select.val()]));

    org_select.on("change", function() {
        grp_select.html(create_grp_list(TestData.orgs[org_select.val()]));

        if (org_select.val() >= 0) {
            grp_select_container.removeClass("select-container-hide");
        } else {
            grp_select_container.addClass("select-container-hide");
        }

        org_select.removeClass("select-error");
    });

    grp_select.on("change", function() {
        grp_select.removeClass("select-error");
    });

    gender_select.on("change", function() {
        gender_select.removeClass("select-error");
    });

    $("#start-testing-button").click(function() {
        let hasError = false;
        org_select.removeClass("select-error");
        grp_select.removeClass("select-error");

        if (org_select.val() < 0) {
            org_select.addClass("select-error");
            hasError = true;
        }

        if (grp_select.val() < 0) {
            grp_select.addClass("select-error");
            hasError = true;
        }

        if (gender_select.val() == "none") {
            gender_select.addClass("select-error");
            hasError = true;
        }

        if (!hasError) {
            window.addEventListener("beforeunload", function (e) {
                var confirmationMessage = "\o/";

                (e || window.event).returnValue = confirmationMessage; //Gecko + IE
                return confirmationMessage;                            //Webkit, Safari, Chrome
            });

            gender = gender_select.val();

            start_screen.addClass("hidden");
            test_choose_screen.removeClass("hidden");
            global_wrapper.removeClass("bg1");
            global_wrapper.addClass("bg2");

            create_tests_buttons();
        }
    });

    $("#back-to-start-screen-button").click(function() {
        generate_excel();

        location.reload();
    });

    $("#back-to-test-choose-screen-button").click(function() {
        test_start_screen.addClass("hidden");
        test_choose_screen.removeClass("hidden");
    });

    $("#begin-selected-test-button").click(function() {
        let isConfirm = confirm("Приступить к выполнению теста?");
        if (isConfirm) {
            test_start_screen.addClass("hidden");
            test_question_screen.removeClass("hidden");
            begin_test();
        }
    });
});

function create_tests_buttons() {
    test_buttons.html(generate_tests_buttons(TestData.tests));
    generate_test_buttons_events(TestData.tests);
}

function generate_excel() {
    var book = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        book,
        XLSX.utils.aoa_to_sheet([
            ["Пол", gender_select.val()],
            ["Орг-ция", TestData.orgs[org_select.val()].name],
            ["Группа", TestData.orgs[org_select.val()].groups[grp_select.val()]]
        ]),
        "Информация"
    );

    let passed_tests_count = 0;

    for (var test in tests_data) {
        if (tests_data[test].status != "finished") continue;

        passed_tests_count++;

        var answer_sheet = [[]];
        answer_sheet[0] = [tests_data[test].name];
        answer_sheet[2] = ["Номер", "Ответ"];

        let answer_index = 3;
        for (var answer in tests_data[test].answers) {
            answer_sheet[answer_index] = [answer, tests_data[test].answers[answer]];
            answer_index++;
        }

        XLSX.utils.book_append_sheet(
            book,
            XLSX.utils.aoa_to_sheet(answer_sheet),
            `Тест ${tests_data[test].id}`
        );
    }

    if (passed_tests_count == 0) return;

    XLSX.writeFile(book, "write3.ods");

    //var wopts = { bookType:'ods', bookSST:false, type:'base64' };
    //var wbout = XLSX.write(wb,wopts);
    //console.log(wbout);
}

function create_org_list(orgs) {
    if (orgs == null || orgs.length < 1) {
        return create_list_item(-10, "[СПИСОК ПУСТ]");
    }

    let html = create_list_item(-1, "Выберите из списка...");

    for (let i = 0; i < orgs.length; i++) {
        html += create_list_item(i, orgs[i].name);
    }

    return html;
}

function create_grp_list(org) {
    if (org == null || org.groups.length < 1) {
        return create_list_item(-10, "");
    }
    else {
        let html = create_list_item(-1, "Выберите из списка...");

        for (let i = 0; i < org.groups.length; i++) {
            html += create_list_item(i , org.groups[i]);
        }

        return html;
    }
}

function create_list_item(value, text, extTags = "") {
    return `<option value="${value}" ${extTags}>${text}</option>\n`;
}

let tests_data = {};

function generate_tests_buttons(tests) {
    if (tests == null) {
        return "";
    }

    let html = "";
    for (let i = 0; i < tests.length; i++) {
        if (tests[i].gender != null) {
            if (tests[i].gender != gender) continue;
        }

        if (tests_data[i] == null) {
            tests_data[i] = {};
            tests_data[i].status = "available";
            tests_data[i].name = TestData.tests[i].name;
        }

        html += create_test_button(i, tests[i].name);
    }

    return html;
}

function generate_test_buttons_events(tests) {
    if (tests == null) {
        return;
    }

    for (let i = 0; i < tests.length; i++) {
        if (tests[i].gender != null) {
            if (tests[i].gender != gender) continue;
        }

        $(`#test-${i}-button`).click(function() {
            if (tests_data[i].status == "finished") {
                alert("Вы уже прошли этот тест.");
                return;
            }

            current_test = TestData.tests[i];
            current_test.id = i;
            current_test_title.html(current_test.name);
            test_choose_screen.addClass("hidden");
            test_start_screen.removeClass("hidden");
        });
    }
}

function create_test_button(index, name) {
    let passed_test = "";
    if (tests_data[index].status == "finished") {
        passed_test = "passed-test";
    }
    return `<input type="button" id="test-${index}-button" value="${name}" class="button test-button ${passed_test}">\n`;
}

let questions_passed = 1;

let answers = {};

function begin_test() {
    answers = {};
    questions_passed = 1;
    current_question = 1;
    time_remain = 1800;
    time.html("30:00");

    if (current_test.answerType == "simple") {
        simple_answers_section.removeClass("hidden");
        extended_answers_section.addClass("hidden");
    } else if (current_test.answerType == "extended") {
        simple_answers_section.addClass("hidden");
        extended_answers_section.removeClass("hidden");
    } else alert("Некорректный тип ответов");

    update_current_test_screen();

    timer_id = window.setInterval(() => {
        time_remain--;

        let min = Math.floor(time_remain / 60).toString();
        let sec = (time_remain % 60).toString();

        if (min.length < 2) min = "0" + min;
        if (sec.length < 2) sec = "0" + sec;

        time.html(`${min}:${sec}`);

        if (time_remain < 1) {
            clearInterval(timer_id);

            alert("Время тестирования подошло к концу.");
            finish_test(false);
        }
    }, 1000);
}

function click_answer(val) {
    answers[current_question] = val;

    if (current_question < current_test.questions.length) {
        current_question++;
    }

    if (questions_passed < current_question) {
        questions_passed = current_question;
    }

    update_current_test_screen();
}

function previous_question() {
    if (current_question > 1) {
        current_question--;
    }

    update_current_test_screen();
}

function next_question() {
    if (current_question < questions_passed) {
        current_question++;
    }

    update_current_test_screen();
}

function update_current_test_screen() {
    current_question_text.html(current_test.questions[current_question - 1].text);

    percents.html(`${Math.floor(questions_passed / current_test.questions.length * 100)}%`);

    update_selected_answer(answers[current_question]);

    if (current_question <= 1) {
        previous_question_button.css("display", "none");
    } else {
        previous_question_button.css("display", "block");
    }

    if (current_question >= questions_passed) {
        next_question_button.css("display", "none");
    } else {
        next_question_button.css("display", "block");
    }

    if (Object.keys(answers).length == current_test.questions.length) {
        finish_test_button.css("display", "block");
    } else {
        finish_test_button.css("display", "none");
    }
}

function update_selected_answer(answer) {
    if (current_test.answerType == "simple") {
        yes_button.removeClass("answered");
        no_button.removeClass("answered");

        if (answer == null) return;

        switch (answer) {
            case "yes": yes_button.addClass("answered"); break;
            case "no": no_button.addClass("answered"); break;
        }
    } else if (current_test.answerType == "extended") {
        answer_no_button.removeClass("answered");
        answer_almost_no_button.removeClass("answered");
        answer_neutral_button.removeClass("answered");
        answer_almost_yes_button.removeClass("answered");
        answer_yes_button.removeClass("answered");

        if (answer == null) return;

        switch (answer) {
            case "no": answer_no_button.addClass("answered"); break;
            case "almost_no": answer_almost_no_button.addClass("answered"); break;
            case "neutral": answer_neutral_button.addClass("answered"); break;
            case "almost_yes": answer_almost_yes_button.addClass("answered"); break;
            case "yes": answer_yes_button.addClass("answered"); break;
        }
    }
}

function finish_test(isConfirm = true, showAnswers = false) {
    if (isConfirm) {
        let isFinished = confirm("Завершить прохождение теста?");
        if (!isFinished) return;
    }

    if (showAnswers) {
        let keycount = 0;
        for (key in answers) keycount++;

        let str = `length: ${keycount}\n\n`;
        for (key in answers) {
            str += `${key}: ${answers[key]}\n`;
        }
        alert(str);
    }

    clearInterval(timer_id);

    tests_data[current_test.id].status = "finished";
    tests_data[current_test.id].id = current_test.id + 1;
    tests_data[current_test.id].answers = {};
    for (key in answers) {
        tests_data[current_test.id].answers[key] = answers[key];
    }

    create_tests_buttons();

    test_question_screen.addClass("hidden");
    test_finish_screen.removeClass("hidden");
}

function return_to_test_selection_screen() {
    test_finish_screen.addClass("hidden");
    test_choose_screen.removeClass("hidden");
}
