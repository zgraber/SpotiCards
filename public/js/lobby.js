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
})