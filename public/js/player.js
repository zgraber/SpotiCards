var socket = io();

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

$(document).ready(() => {
    $('<span></span>', {
        text: 'Code: ' + game_code,
    }).appendTo('#bar-game-code');

    $('<span></span>', {
        text: player_name,
    }).appendTo('#player-name');

    socket.emit('join room', {
        player_name,
        game_code
    });
    socket.on('game-question', (data) => {
        //Change view to options
        console.log(data);
        $('#join-confirm').hide();
        $('#player-options').empty();
        for (let i=0; i < data.options.length; i++) {
            $('<button></button>', {
                id: ('option' + i),
                class: "btn btn-primary btn-lg btn-options",
                text: data.options[i],
            }).appendTo('#player-options');
        }
    });
});