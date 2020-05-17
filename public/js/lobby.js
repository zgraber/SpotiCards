var socket = io();

function loadPlayerNames(){
    let id = window.location.pathname.split('/')[2];
    let url = window.location.origin + '/game/' + id + '/players';
    $.ajax({
        url: url,
        success: (result) => {
            if(result.player_names.length > 0) {
                for (let i=0; i < result.player_names.length; i++) {
                    $('<li></li>', {
                        id: ('player' + i),
                        class: "list-group-item",
                        text: result.player_names[i],
                    }).appendTo('#player-list');
                }
                $('#player-list').show();
                $('#no-players').hide();
            }
        }
    });
}

$(document).ready(()=>{
    $("#player-list").hide();
    loadPlayerNames();
    socket.emit('register screen',{
        game_code: $('#game-code').text()
    });
    socket.on('player join', (data) => {
        if($("#no-players").is(":visible")){
            $('#no-players').hide();
            $('#player-list').show();
        }
        console.log(data.player_name);
        $('<li></li>', {
            class: "list-group-item",
            text: data.player_name,
        }).appendTo('#player-list');
    });
})