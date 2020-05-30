var socket = io();
var points = 0;
var score = 0;

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
    $("#score").text(score);
    getQuestionInfo();
    socket.on('answer result', (data)=> {
        // correct_answer <-- the index of the corrrect answer
        var index = data.correct_answer;
        if(data.result === true) {
            //increment score
            score = score + 1;
            $("#score").text(score);
            //change color of incorrect buttons
            $(".btn").css("background-color", "#b91d34");
            $(".btn").css("border-color", "#b91d34");
            // change color of button that is correct
            $("#option" + index).css("background-color", "#d4af37");
            $("#option" + index).css("border-color", "#d4af37");
            // display correct box
            $("#result-box").css("background-color", "#1DB954");
            $("#result-box").text("Congratulations!");
            $("#res-dismiss").show();
        } else {
            //change color of incorrect buttons
            $(".btn").css("background-color", "#b91d34");
            $(".btn").css("border-color", "#b91d34");
            // change color of button that is correct
            $("#option" + index).css("background-color", "#d4af37");
            $("#option" + index).css("border-color", "#d4af37");
            // display incorrect box
            $("#result-box").css("background-color", "#b91d34");
            $("#result-box").text("Incorrect :(");
            $("#res-dismiss").show();
        }

    });

    socket.on('game over', () => {
        url = window.location.href;
        window.location.href = url + "/game_over";        
    });
});

// .btn-primary: disabled {background-color: #007bff}