/**
 * Created by dianda on 16/08/2017.
 */
var socketio = require('socket.io');
var io;
var geustNumber = 1;
var nicknames = {};
var namesUsed = [];
var currentroom = {};


exports.listen = function (server) {
    io  = socketio.listen(server);
    io.set('log level', 1);
    io.sockets.on('connection', function (socket) {

    });
}

//------辅助函数---------

//分配用户昵称
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {

    var name = 'Guest' + guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult', {
        success: true,
        name:name
    });

    //数组插入数据
    namesUsed.push(name);
    return geustNumber + 1;
}


//进入聊天室
function joinRoom(socket, room) {

    socket.join(room);
    currentroom[socket.id] = room;
    socket.emit('joinResult', {room: room});
    socket.broadcast.to(room).emit('message', {
        text:nicknames[socket.id] + 'has joined ' + room + '.'
    });


    var usersInRoom = io.sockets.client(room);
    if (usersInRoom.length > 1) {

        var usersInRoomSummary = 'Users currently in ' + room + ': ';
        for (var index in usersInRoom) {
            var userSocketid = usersInRoom[index].id;
            if(userSocketid != socket.id) {

                if(index > 0) {
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += nicknames[userSocketid];
            }
        }

        usersInRoomSummary += '. ';
        socket.emit('message',{ text: usersInRoomSummary });
    }

}


//处理昵称变更请求
function handleNameChangeAttemp(socket, nickNames, nameUsed) {

    //添加nameAttemp事件监听
    socket.on('nameAttemp', function (name) {

        if(name.indexOf('Guest') == 0){
            socket.emit('nameResult', {
                success: true,
                message: 'Names cannot begin with "Guest"!'
            });
        }else {
            if(namesUsed.indexOf(name) == -1){
                //得到老昵称和坐标
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;

                //删除老的
                delete nameUsed[previousNameIndex];
                socket.emit('nameResult', {
                    success: true,
                    name:name
                });

                socket.broadcast.to(currentroom[socket.id]).emit('messgae', {
                    text: previousName + 'is now known as ' + name + '. '
                });
            }else {
                socket.emit('nameResult', {
                    success: false,
                    message:'That name is already in use'
                });
            }
        }
    });
}

//处理聊天消息

function handleMessgaeBrocasting(socket) {
    
    socket.on('message', function (message) {
        socket.broadcast.to(message.room).emit('messgae', {
            text: nicknames[socket.id] + ': ' + message.text
        });
    });
}

//处理用户加入已有房间,若房间没有,就创建一个
function handleRoomJoining(socket) {
    
    socket.on('join', function (room) {

        socket.leave(currentroom[socket.id]);
        joinRoom(socket, room.newRoom);
    });
}

//用户断开链接

function handleClientDisconnection(socket) {
    socket.on('disconenct',function () {
       var nameIndex = namesUsed.indexOf(nicknames[socket.id]);
        delete namesUsed[nameIndex];
        delete nicknames[socket.id];
    });
}