$(document).ready(function(){
    $("#join-form").submit(event => {
        event.preventDefault();
        url = window.location.origin + "/game?code=" + $("#game_code").val().toUpperCase();
        $.ajax({
            url: url,
            success: (result) => {
                if(result.found){
                    //console.log("GAME FOUND");
                    window.location.href = window.location.origin + '/authorize';
                } else {
                   $("#game-missing").text("Game not found");
                }
            }
        });
    });
});