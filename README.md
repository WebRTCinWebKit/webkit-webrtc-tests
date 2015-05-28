## webkit-webrtc-tests
Repo to share simple tests

Buttons Test: http://webrtcinwebkit.github.io/webkit-webrtc-tests/buttons.html

### Peer-2-peer Example

This test consists of a client app and a small server part that acts both as a signaling server, and a web server that hosts the client app at http://localhost:8080. You need node.js to run the server parts. This example is only tested with video between WebKitGTK+ MiniBrowser and Chrome at the moment.

Follow these steps to run the test:

1. Build the WebRTC enabled WebKit available at \[1\] (see \[2\] for building instructions).
2. Start the combined signaling and web server by running `node channel_server.js` from the p2p-example directory (this repo).
3. Start the MiniBrowser: `Tools/Scripts/run-minibrowser --gtk --enable-media-stream=1 http://localhost:8080`.
4. Star Chrome and point it to `http://localhost:8080`.
5. Click the join button in both browsers to join the defalut session ("test").
6. Initiate the call from MiniBrowser by clicking the "Initiate Call" button.

\[1\] https://github.com/WebRTCinWebKit/webkit

\[2\] http://trac.webkit.org/wiki/BuildingGtk
