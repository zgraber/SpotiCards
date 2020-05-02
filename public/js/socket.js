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
                    class: "btn btn-primary btn-options",
                    text: result.options[i],
                    on: {
                        click: answerSubmit
                    }
                }).appendTo('#options');
            }
        }
    });
}

answerSubmit = (event) => {
    alert( "Handler for button " + $(event.target).text() + " called." );
    event.preventDefault();
};

$(document).ready(()=>{
    getQuestionInfo();
});
var socket = io();
