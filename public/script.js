const socket = io();
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const statusDiv = document.getElementById('status');
const searchingOverlay = document.getElementById('searchingOverlay');

let myStream, peer, myPeerId, currentCall;
let myGender = 'male', myFilter = 'any';

socket.on('online-count', (count) => {
    document.getElementById('onlineCount').innerText = count;
});

window.handleStart = async () => {
    if(!document.getElementById('userName').value) return alert("Naam dalo bhai!");
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('chatInterface').classList.remove('hidden-screen');

    try {
        myStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, audio: true 
        });
        localVideo.srcObject = myStream;
        
        peer = new Peer(undefined, {
            config: { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }
        });

        peer.on('open', (id) => {
            myPeerId = id;
            handleNext();
        });

        // Receiver logic: Jab call aaye tabhi answer karo
        peer.on('call', (call) => {
            currentCall = call;
            call.answer(myStream);
            call.on('stream', (strangerStream) => {
                remoteVideo.srcObject = strangerStream;
                searchingOverlay.classList.add('hidden-screen');
                statusDiv.innerText = "Connected!";
            });
        });

    } catch (e) { alert("Camera Permission Error!"); }
};

// Initiator logic: Server batayega tabhi call karo
socket.on('matched', ({ partnerPeerId, role }) => {
    if (role === 'initiator') {
        statusDiv.innerText = "Connecting...";
        // Thoda delay taaki receiver ready ho jaye
        setTimeout(() => {
            const call = peer.call(partnerPeerId, myStream);
            currentCall = call;
            call.on('stream', (strangerStream) => {
                remoteVideo.srcObject = strangerStream;
                searchingOverlay.classList.add('hidden-screen');
                statusDiv.innerText = "Connected!";
            });
        }, 1500);
    }
});

window.handleNext = () => {
    if(currentCall) currentCall.close();
    remoteVideo.srcObject = null;
    searchingOverlay.classList.remove('hidden-screen');
    statusDiv.innerText = "Searching...";
    socket.emit('join', { peerId: myPeerId, gender: myGender, filter: myFilter });
};

// Baaki UI functions (setGender, changeFilter) purane hi rakho
window.setGender = (g) => {
    myGender = g;
    document.getElementById('mBtn').style.border = g==='male'?'2px solid white':'none';
    document.getElementById('fBtn').style.border = g==='female'?'2px solid white':'none';
};
window.changeFilter = (f) => {
    myFilter = f;
    document.getElementById('anyFilter').style.background = f==='any'?'#4f46e5':'#18181b';
    document.getElementById('girlFilter').style.background = f==='girl'?'#db2777':'#18181b';
};
