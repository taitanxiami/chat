/**
 * Created by dianda on 16/08/2017.
 */

function divEscapedContentElement(message) {
    return $('<div></div>').text(message);
}

function divSystemContentElement(messge) {
    return $('<div></div>').html('<li>' + messge + '</li>');
}


//处理用户的输入
function processUserInput(chatApp, socket) {
    var message = $('#send-message').val();
    var systemMessage;
    if(message.charAt(0) == '/') {
      // '/' 作为聊天命令
        systemMessage = chatApp.processCommand(message);
        if(systemMessage){
            $('#message').append(divSystemContentElement(systemMessage));
        }else {
            chatApp.sendMessage($('#room').text(), message);
            $('#message').append(divEscapedContentElement(message));
            $('#message').scrollTop($('#message').prop('scollHeight'));
        }

        $('#send-message').val('');
    }

}


var socket = io.connect();

$(document).ready(function () {

    var chatApp = new Chat(socket);
    socket.on('nameResult', function (result) {
       var message;
        if(result.message) {
            message = 'You are now kown as ' + result.name + '.';
        }else {
            message  = result.message;
        }
        $('#message').append(divSystemContentElement(message));
    });

    socket.on('joinResult', function (result) {
       $('#room').text(result.room);
        $('#message').append(divEscapedContentElement('Room changed'));
    });

    socket.on('message', function (message) {
       var newElement = $('<div></div>').text(message.text);
        $('#message').append(newElement);
    });

    socket.on('rooms',function (rooms) {

        $('#room-list').empty();

        for(var room in rooms) {
            room = room.substring(1, room.length);
            if(room != ''){
                $('#room-list').append(divEscapedContentElement(room));
            }
        }

        $('#room-list div').click(function () {
            chatApp.processCommand('/join '+ $(this).text());
            $('#send-message').focus();
        });

    });

//定期请求可用房间列表
    setInterval(function () {
        socket.emit('rooms');
    }, 1000);

    $('#send-message').focus();
    $('#send-form').submit(function () {

        processUserInput(chatApp, socket);
        return false;
    });

})