var socket = io();
var playerChoice = -1;
var questionNum = 1;

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
var player_name = getCookie('player_name');
var game_code = getCookie('game_code');

if (player_name === "" || game_code === "") {
    console.log('player_name and/or game_code not found in cookies');
    window.location.replace(window.location.origin);
}

var answerSubmit = (event) => {
    let index = $(".btn-options").index($(event.target));
    //Set the global playerChoice to verify answer later
    playerChoice = index;
    //event.preventDefault();

    //Emit player-answer to the server
    socket.emit('player-answer', {
        answer: index,
        game_code: game_code,
        player_name: player_name,
        question_number: questionNum
    });

    //TODO: Change player screen to a confirmation message
    $('#player-options').empty();
    $('#answer-confirm').append(
        $('<div></div>', {class:"card card-player"}).append(
            $('<div></div>', {class:"card-body"}).append(
                $('<h5></h5>', {class:"card-title", text:"You answered! But how certain are you?"})
            )
        )
    );
};

$(document).ready(() => {
    $('<span></span>', {
        text: 'Code: ' + game_code,
    }).appendTo('#bar-game-code');

    $('<span></span>', {
        text: player_name,
    }).appendTo('#player-name');

    socket.emit('join-room', {
        player_name,
        game_code
    });
    socket.on('game-question', (data) => {
        //Change view to options
        console.log(data);
        questionNum = data.question_number;

        $('#join-confirm').hide();
        $('#player-options').empty();
        $('#answer-confirm').empty();
        $('#answer-result').empty();
        $('#question-num').empty();
        $('<span></span>', {
            text: 'Q'+ data.question_number,
        }).appendTo('#question-num');

        for (let i=0; i < data.options.length; i++) {
            $('<button></button>', {
                id: ('option' + i),
                class: "btn btn-primary btn-lg btn-options",
                text: data.options[i],
                on: {
                    click: answerSubmit
                }
            }).appendTo('#player-options');
        }
    });

    socket.on('answer-reveal', (data) => {
        $('#answer-confirm').empty();

        console.log(data)
        if (data.correct_answer === playerChoice) {
            //alert('Correct!');
            $('#answer-result').append(
                $('<div></div>', {class:"card-player card"}).append(
                    $('<img></img>',{
                        class: "card-img-top image-center",
                        src: "/img/correct.png",
                        alt: "Correct Answer Image",
                        width: "200",
                        height: "200"
                    })
                ).append(
                    $('<div></div>', {class:"card-body"}).append(
                        $('<h5></h5>', {class:"card-title", text:"Correct!"})
                    )
                )
            );
        } else {
            //alert('Incorrect');
            $('#answer-result').append(
                $('<div></div>', {class:"card-player card"}).append(
                    $('<img></img>',{
                        class: "card-img-top image-center",
                        src: "/img/wrong.png",
                        alt: "Incorrect Answer Image",
                        width: "225",
                        height: "200",
                    })
                ).append(
                    $('<div></div>', {class:"card-body"}).append(
                        $('<h5></h5>', {class:"card-title", text:"Wrong!"})
                    )
                )
            );
        }
    });
});