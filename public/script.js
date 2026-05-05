const socket = io();
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const nextBtn = document.getElementById('nextBtn');
const statusDiv = document.getElementById('status');

let myStream;
let peer;
let currentCall;

async function startApp() {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }, 
            audio: true 
        });
        localVideo.srcObject = myStream;
        statusDiv.innerText = "Camera Active";

        // STUN Servers: Isse mobile networks par video fast connect hogi
        peer = new Peer(undefined, {
            config: {
                'iceServers': [
                    { url: 'stun:stun.l.google.com:19302' },
                    { url: 'stun:stun1.l.google.com:19302' }
                ]
            }
        });

        peer.on('open', (id) => {
            statusDiv.innerText = "Online & Ready";
            
            nextBtn.onclick = () => {
                if(currentCall) currentCall.close();
                remoteVideo.srcObject = null;
                statusDiv.innerText = "Searching for Stranger...";
                socket.emit('join', id);
                // Button effect
                nextBtn.innerText = "SKIP / NEXT";
                nextBtn.classList.replace('bg-indigo-600', 'bg-red-600');
            };
        });

        peer.on('call', call => {
            currentCall = call;
            call.answer(myStream);
            call.on('stream', (strangerStream) => {
                remoteVideo.srcObject = strangerStream;
                statusDiv.innerText = "Matched! Say Hello 👋";
            });
        });

        socket.on('matched', (strangerPeerId) => {
            statusDiv.innerText = "Stranger Found! Connecting...";
            const call = peer.call(strangerPeerId, myStream);
            currentCall = call;
            call.on('stream', (strangerStream) => {
                remoteVideo.srcObject = strangerStream;
                statusDiv.innerText = "Matched! Say Hello 👋";
            });
        });

    } catch (err) {
        statusDiv.innerText = "Error: Camera Blocked";
        alert("Bhai camera allow kar do settings se!");
    }
}

startApp();
