var socket = io();
var score = 0;
var gameCode = getParameterByName('game_code');

var getQuestionInfo = () => {
    url = window.location.href.split('?')[0] + 'question';
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
                $('<h1></h1>', {
                    id: ('option' + i),
                    class: "btn btn-primary btn-options",
                    text: result.options[i]
                }).appendTo('#options');
            }
        }
    });
}

var getScore =  (callback) => {
    url = window.location.href.split('?')[0] + '/score';
    $.ajax({
        url: url,
        success: (result) => {
            console.log("Score retrieved: ");
            console.log(result.score);
            callback(result.score);
        }
    });
};

var answerSubmit = (event) => {
    disableAnswers();
    let index = $(".btn-options").index($(event.target));
    event.preventDefault();
    url = window.location.href;
    var id = url.substring(url.lastIndexOf('/') + 1);
    socket.emit('answer submit', {answer: index, url_id: id});
};

// Makes buttons unclickable
var disableAnswers = () => {
    $("button").prop("disabled", true);
}

$(document).ready(()=>{
    $("#res-dismiss").hide();
    getScore(function(result){
        score = result;
        $("#score").text(score);
    });
    socket.emit('host-game-join', {game_code: gameCode});
    //getQuestionInfo();
    socket.on('game-question', (data) => {
        $("#result-box").text("")
        $("#result-box").css("background-color", "");
        $("#res-dismiss").hide();

        $("#question-header").text("Question " + data.question_number);
        $("#question-text").text(data.question_text);
        $("#options").empty();
        for (let i=0; i < data.options.length; i++) {
            $('<h4></h4>', {
                id: ('option' + i),
                class: "host-option",
                text: data.options[i],
                on: {
                    click: answerSubmit
                },
            }).appendTo('#options');
        }
    });
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


function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
// .btn-primary: disabled {background-color: #007bff}