var socket = io();
var points = 0;

getQuestionInfo = () => {
    url = window.location.href + '/question';
    $.ajax({
        url: url,
        success: (result) => {
            //Add jquery to clear result box
            $("#result-box").text("")
            $("#result-box").css("background-color", "");
            $("#res-dismiss").hide();

            $("#question-header").text("Question " + result.question_number);
            $("#question-text").text(result.question_text);
            $("#options").empty();
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
    disableAnswers();
    let index = $(".btn-options").index($(event.target));
    event.preventDefault();
    url = window.location.href;
    var id = url.substring(url.lastIndexOf('/') + 1);
    socket.emit('answer submit', {answer: index, url_id: id});
};

// Makes buttons unclickable and TODO: turns the correct answer a different color from the others
disableAnswers = () => {
    $("button").prop("disabled", true);
}

$(document).ready(()=>{
    $("#res-dismiss").hide();
    getQuestionInfo();
    socket.on('answer result', (data)=> {
        if(data === true) {
            //alert("CORRECT");
            $("#result-box").css("background-color", "#1DB954");
            $("#result-box").text("Congratulations!");
            $("#res-dismiss").show();
        } else {
            // alert("INCORRECT");
            $("#result-box").css("background-color", "#b91d34");
            $("#result-box").text("Incorrect :(");
            $("#res-dismiss").show();
        }

    });
});

