var socket = io();

function loadPlayerNames() {
    let id = window.location.pathname.split('/')[2];
    let url = window.location.origin + '/game/' + id + '/players';
    $.ajax({
        url: url,
        success: (result) => {
            if (result.player_names.length > 0) {
                for (let i = 0; i < result.player_names.length; i++) {
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

//return the options in an object
function getOptions() {
    let numQuestions = $('#num-questions option:selected').text();
    let timeRange = $('#time-range option:selected').text();
    switch(timeRange) {
        case 'Short Term':
            timeRange = 'short_term';
            break;
        case 'Medium Term':
            timeRange = 'medium_term';
            break;
        case 'Long Term': 
            timeRange = 'long_term';
            break;
        default:
            timeRange = 'medium_term';
            break;
    }
    return {
        numQuestions: parseInt(numQuestions, 10),
        timeRange: timeRange
    };
}


$(document).ready(() => {
    $("#player-list").hide();
    loadPlayerNames();

    $('#init-game').submit((event) => {
        event.preventDefault();
    
        let id = window.location.pathname.split('/')[2];
        let url = window.location.origin + '/game/' + id + '/init';
        $.ajax({
            url: url,
            data: JSON.stringify(getOptions()),
            contentType: 'application/json',
            type: 'PUT',
            success: (result) => {
                if (result) {
                    console.log(result);
                    window.location.replace(window.location.origin + '/game/' + id);
                    return false;
                } else {
                    console.log("Uh oh. Something's up");
                }
            }
        });
    });
    
    socket.emit('register screen', {
        game_code: $('#game-code').text()
    });
    socket.on('player join', (data) => {
        if ($("#no-players").is(":visible")) {
            $('#no-players').hide();
            $('#player-list').show();
        }

        let found = false;

        selector = `#player-list :contains('${data.player_name}')`;
        selectedList = $(selector);

        if (selectedList.length) {
            found = true;
        }
        if (!found) {
            $('<li></li>', {
                class: "list-group-item",
                text: data.player_name,
            }).appendTo('#player-list');
        }
    });
})