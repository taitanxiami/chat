/**
 * Created by dianda on 16/08/2017.
 */


var fs = require('fs');
var http  = require('http');
var path = require('path');
var mime = require('mime');
var cache = {};


function send404(response) {

    response.writeHead(404, {'Content-type':'text/plain'});
    response.write('Error 404: resource not found');
    response.end();
}


function sendFile(response, filepath, fileContents) {

    response.writeHead(
        200,
        {'Content-type': mime.lookup(path.basename(filepath))}
    );
    response.end(fileContents);
}

//提供静态文件服务
function serverStatic(response, cache, abspath) {

    if (cache[abspath]) {
        sendFile(response, abspath, cache[abspath]);
    } else {
        //如果不存在缓存
        fs.exists(abspath, function (exists) {

            if (exists) {
                fs.readFile(abspath, function (error, data) {

                    if (error) {
                        send404(response);
                    } else {
                        cache[abspath] = data;
                    }
                });
            } else {
                send404(response);
            }
        });
    }
}


// 创建http服务器
var server = http.createServer(function(request, response){

    var filepath = false;
    if(request.url == '/') {
        filepath = 'public/index.html';
    }else {
        filepath = 'public' + request.url;
    }   //将url 转为文件路径
    var abspath = './' + filepath;

    console.log('abspath = ' + abspath);
    serverStatic(response, cache, abspath);  //返回静态文件
})

server.listen(3003, function(){
    console.log('Server listning on port 3003');
});

var chatServer = require('./lib/chat_server');
chatServer.listen(server);