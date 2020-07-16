var socket = io();
var gameCode = getParameterByName('game_code');

var getScores =  (callback) => {
    url = window.location.href.split('?')[0] + 'scores';
    $.ajax({
        url: url,
        success: (result) => {
            console.log("Scores retrieved: ");
            console.log(result);
            callback(result);
        }
    });
};

function loadPlayerNames() {
    let id = window.location.pathname.split('/')[2];
    let url = window.location.origin + '/game/' + id + '/players';
    $.ajax({
        url: url,
        success: (result) => {
            if (result.player_names.length > 0) {
                for (let i = 0; i < result.player_names.length; i++) {
                    $('#player-list').append(
                        $('<li></li>', {
                            id: ('player' + i),
                            class: "list-group-item",
                            text: result.player_names[i],
                        }).append(
                            $('<span></span>', {
                                class: 'player-score',
                                text: 0
                            })
                    ));
                }
            }
        }
    });
}

function endQuestion() {
    $("#res-dismiss").hide();
    socket.emit('end-question', {game_code: gameCode});
}

$(document).ready(()=>{
    $("#res-dismiss").hide();
    loadPlayerNames();
    getScores((result) => {
        result.forEach(function(scoreObj) {
            $('#player' + scoreObj.player_index).children('.player-score').first().text(scoreObj.score);
        });
    });
    socket.emit('host-game-join', {game_code: gameCode});
    //getQuestionInfo();
    socket.on('game-question', (data) => {
        $('#player-list li').css('color', 'white');
        $("#res-dismiss").hide();

        $("#question-header").text("Question " + data.question_number);
        $("#question-text").text(data.question_text);
        $("#options").empty();
        for (let i=0; i < data.options.length; i++) {
            $('<h4></h4>', {
                id: ('option' + i),
                class: "host-option",
                text: data.options[i],
            }).appendTo('#options');
        }
    });

    socket.on('player-answer-confirm', (data) => {
        console.log(data.player_name + ' has answered');
        $('.list-group-item:contains(' + data.player_name + ')').css('color', '#1DB954')
    });

    socket.on('answer-reveal', (data)=> {
        console.log(data);
        // correct_answer <-- the index of the corrrect answer
        var index = data.correct_answer;     
        //change color of incorrect buttons
        $(".host-option").css("background-color", "#b91d34");
        $(".host-option").css("border-color", "#b91d34");
        // change color of button that is correct
        $("#option" + index).css("background-color", "#d4af37");
        $("#option" + index).css("border-color", "#d4af37");
        // display correct box
        getScores((result) => {
            result.forEach(function(scoreObj) {
                $('#player' + scoreObj.player_index).children('.player-score').first().text(scoreObj.score);
            });
        });
        $("#res-dismiss").show();
        
    });

    socket.on('game-over', () => {
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