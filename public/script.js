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
        // 1. Camera access lo
        myStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 480, height: 640 }, 
            audio: true 
        });
        localVideo.srcObject = myStream;
        statusDiv.innerText = "Camera Ready";

        // 2. PeerJS setup
        peer = new Peer();

        peer.on('open', (id) => {
            console.log('My ID:', id);
            statusDiv.innerText = "Online";
            
            // 3. Button Click Event
            nextBtn.onclick = () => {
                if(currentCall) currentCall.close();
                remoteVideo.srcObject = null;
                statusDiv.innerText = "Searching...";
                socket.emit('join', id); // Server ko apni ID bhejo match ke liye
            };
        });

        // 4. Jab koi stranger call kare
        peer.on('call', call => {
            currentCall = call;
            call.answer(myStream);
            call.on('stream', (strangerStream) => {
                remoteVideo.srcObject = strangerStream;
                statusDiv.innerText = "Connected";
            });
        });

        // 5. Jab server kahe ki match mil gaya
        socket.on('matched', (strangerPeerId) => {
            statusDiv.innerText = "Connecting...";
            const call = peer.call(strangerPeerId, myStream);
            currentCall = call;
            call.on('stream', (strangerStream) => {
                remoteVideo.srcObject = strangerStream;
                statusDiv.innerText = "Connected";
            });
        });

    } catch (err) {
        console.error(err);
        alert("Camera permission denied! Please refresh and allow.");
    }
}

startApp();
