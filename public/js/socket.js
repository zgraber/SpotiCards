getQuestionInfo = () => {
    url = window.location.href + '/question';
    $.ajax({
        url: url,
        success: (result) => {
            $("#question-header").text("Question " + result.question_number);
            $("#question-text").text(result.question_text);
            for (let i=0; i < result.options.length; i++) {
                $('<button></button>', {
                    id: ('option' + i),
                    class: "btn btn-primary",
                    text: result.options[i]
                }).appendTo('#options');
            }
        }
    });
}
$(document).ready(getQuestionInfo);
var socket = io();