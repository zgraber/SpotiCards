var getScores =  (callback) => {
    let id = window.location.pathname.split('/')[2];
    let url = window.location.origin + '/game/' + id + '/scores';
    $.ajax({
        url: url,
        success: (result) => {
            console.log("Scores retrieved: ");
            console.log(result);
            callback(result);
        }
    });
};

$(document).ready(()=>{
    getScores( (result) => {
        result.sort(function(a,b){
            return b.score - a.score;
        });
        result.forEach(player => {
            $('#player-list').append(
                $('<li></li>', {
                    class: "list-group-item",
                    text: player.name,
                }).append(
                    $('<span></span>', {
                        class: 'player-score',
                        text: player.score
                    })
            ));
        });
    });
});