const socket = io.connect('http://localhost:3000');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const peerConnection = new RTCPeerConnection(configuration);

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
    localVideo.srcObject = stream;
    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
});

peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
};

socket.on('offer', (offer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    peerConnection.createAnswer().then((answer) => {
        return peerConnection.setLocalDescription(answer);
    }).then(() => {
        socket.emit('answer', peerConnection.localDescription);
    });
});

socket.on('answer', (answer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', (iceCandidate) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidate));
});

peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
    }
};

function startCall() {
    peerConnection.createOffer().then((offer) => {
        return peerConnection.setLocalDescription(offer);
    }).then(() => {
        socket.emit('offer', peerConnection.localDescription);
    });
}
