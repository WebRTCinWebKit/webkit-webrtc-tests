var fs = require("fs");
var http = require("http");
var path = require("path");

var WebSocketServer = require("ws").Server;
var WebSocket = require("ws");

var sessions = {};
var usersInSessionLimit = 2;

var serverDir = path.dirname(__filename)
var clientDir = path.join(serverDir, "client/");

var contentTypeMap = {
    ".html": "text/html;charset=utf-8",
    ".js": "text/javascript"
};

var server = http.createServer(function (request, response) {
    var url = request.url.split("?", 1)[0];
    var filePath = path.join(clientDir, url);
    if (filePath.indexOf(clientDir) != 0 || filePath == clientDir)
        filePath = path.join(clientDir, "/webrtc_example.html");

    fs.stat(filePath, function (err, stats) {
        if (err || !stats.isFile()) {
            response.writeHead(404);
            response.end("404 Not found");
            return;
        }

        var contentType = contentTypeMap[path.extname(filePath)] || "text/plain";
        response.writeHead(200, { "Content-Type": contentType });

        var readStream = fs.createReadStream(filePath);
        readStream.on("error", function () {
            response.writeHead(500);
            response.end("500 Server error");
        });
        readStream.pipe(response);
    });
});
server.listen(8080);

var server = new WebSocketServer({
    "server": server,
    "autoAcceptConnections": false
});

server.on("connection", function (ws) {
    var parts = ws.protocol.split("-");
    var sessionId = parts[0];
    var userId = parts[1];

    var session = sessions[sessionId];
    if (!session) {
        console.log("new session: " + sessionId);
        session = sessions[sessionId] = { "users": {} };
    }

    if (Object.keys(session.users).length + 1 > usersInSessionLimit) {
        console.log("Already " + Object.keys(session.users).length + "users in session (full)");
        ws.send(">sessionfull");
        return;
    }

    // Announce joining
    for (var uid in session.users) {
        ws.send(uid + ">join");
        session.users[uid].send(userId + ">join");
    }

    session.users[userId] = ws;

    ws.onmessage = function (evt) {
        var messageParts = evt.data.split("<", 2);
        var targetUserId = messageParts[0];
        var data = messageParts[1];

        var target = session.users[targetUserId];
        if (target && target.readyState == WebSocket.OPEN)
            target.send(userId + ">" + data);
        else
            console("WARNING: unable to send to " + targetUserId);
    };

    ws.onclose = function (evt) {
        delete session.users[userId];

        // Announce leaving
        for (var uid in session.users)
            session.users[uid].send(userId + ">leave");

        if (!Object.keys(session.users).length) {
            console.log("session ended: " + sessionId);
            delete sessions[sessionId];
        }
    };
});