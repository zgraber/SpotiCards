var socket = io();
var points = 0;

getQuestionInfo = () => {
    url = window.location.href + '/question';
    $.ajax({
        url: url,
        success: (result) => {
            //Add jquery to clear result box
            // $("#result-box").text("")
            // $("#result-box").css("background-color", "");

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
    let index = $(".btn-options").index($(event.target));
    event.preventDefault();
    url = window.location.href;
    var id = url.substring(url.lastIndexOf('/') + 1);
    socket.emit('answer submit', {answer: index, url_id: id});
};

$(document).ready(()=>{
    getQuestionInfo();
    socket.on('answer result', (data)=> {
        if(data === true) {
            //alert("CORRECT");
            $("#result-box").css("background-color", "#1DB954");
            $("#result-box").text("Congratulations!");
        } else {
            // alert("INCORRECT");
            $("#result-box").css("background-color", "#b91d34");
            $("#result-box").text("Incorrect :(");
        }
        
        getQuestionInfo();
    });
});

