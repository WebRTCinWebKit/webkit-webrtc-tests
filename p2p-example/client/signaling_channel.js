/*
 * Simple signaling channel for WebRTC (use with channel_server.js).
 */

function SignalingChannel(sessionId) {
    if (!sessionId)
        sessionId = location.hash = location.hash.substr(1) || createId();
    userId = createId();

    var channels = {};

    var listeners = {
        "onpeer": null,
        "onsessionfull": null
    };
    for (var name in listeners)
        Object.defineProperty(this, name, createEventListenerDescriptor(name, listeners));

    function createId() {
        return Math.random().toString(16).substr(2);
    };

    var ws = new WebSocket("ws://" + location.hostname + ":" + location.port, sessionId + "-" + userId);

    ws.onopen = function () {
    };

    ws.onclose = function () {
    };

    ws.onerror = function () {
        ws.close();
    };

    ws.onmessage = function (evt) {
        var parts = evt.data.split(">", 2);
        var peerUserId = parts[0];
        var data = parts[1];

        if (data == "join") {
            console.log("join: " + peerUserId);
            channels[peerUserId] = new PeerChannel(peerUserId);
            fireEvent({ "type": "peer", "peer": channels[peerUserId] }, listeners);

        } else if (data == "leave") {
            console.log("leave: " + peerUserId);
            var channel = channels[peerUserId];
            if (channel) {
                channel.didLeave();
                delete channels[peerUserId];
            }

        } else if (data == "sessionfull") {
            fireEvent({"type": "sessionfull"}, listeners);
            ws.close();

        } else {
            var channel = channels[peerUserId];
            if (channel)
                channel.didGetData(data);
        }
    };

    function PeerChannel(peerUserId) {
        var listeners = {
            "onmessage": null,
            "ondisconnect": null
        };
        for (var name in listeners)
            Object.defineProperty(this, name, createEventListenerDescriptor(name, listeners));

        this.didGetData = function (data) {
            fireEvent({"type": "message", "data": data }, listeners);
        };

        this.didLeave = function () {
            fireEvent({"type": "disconnect" }, listeners);
        };

        this.send = function (message) {
            ws.send(peerUserId + "<" + message);
        };
    }

    function createEventListenerDescriptor(name, listeners) {
        return {
            "get": function () { return listeners[name]; },
            "set": function (cb) { listeners[name] = cb instanceof Function ? cb : null; },
            "enumerable": true
        };
    }

    function fireEvent(evt, listeners) {
        var listener = listeners["on" + evt.type]
        if (listener)
            listener(evt);
    }
}