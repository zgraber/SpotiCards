var socket = io();

getQuestionInfo = () => {
    url = window.location.href + '/question';
    $.ajax({
        url: url,
        success: (result) => {
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
    let index = $(".btn-options").index($(event.target));
    event.preventDefault();
    url = window.location.href;
    var id = url.substring(url.lastIndexOf('/') + 1);
    socket.emit('answer submit', {answer: index, url_id: id});
};

$(document).ready(()=>{
    getQuestionInfo();
    socket.on('answer result', (data)=> {
        if(data === true) {
            alert("CORRECT");
        } else {
            alert("INCORRECT");
        }
        getQuestionInfo();
    });
});

