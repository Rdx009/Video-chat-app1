const socket = io();
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const chatBox = document.getElementById('chatBox');
const msgInput = document.getElementById('msgInput');

let myStream, peer, myPeerId, currentCall, partnerSocketId;
let myGender = 'male', myFilter = 'any', isMuted = false, isVidOff = false;
let currentFacingMode = "user"; // Front camera

socket.on('online-count', (count) => { document.getElementById('onlineCount').innerText = count; });

window.setGender = (g) => {
    myGender = g;
    document.getElementById('mBtn').className = g === 'male' ? 'flex-1 bg-pink-600 p-4 rounded-2xl border-2 border-white font-bold' : 'flex-1 bg-zinc-900 p-4 rounded-2xl border-2 border-transparent font-bold';
    document.getElementById('fBtn').className = g === 'female' ? 'flex-1 bg-pink-600 p-4 rounded-2xl border-2 border-white font-bold' : 'flex-1 bg-zinc-900 p-4 rounded-2xl border-2 border-transparent font-bold';
};

window.handleStart = async () => {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacingMode }, audio: true });
        localVideo.srcObject = myStream;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('chatInterface').classList.remove('hidden-screen');
        initPeerJS();
    } catch (e) { alert("Camera Error!"); }
};

function initPeerJS() {
    peer = new Peer(undefined, { config: { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] } });
    peer.on('open', (id) => { myPeerId = id; handleNext(); });
    peer.on('call', (call) => {
        currentCall = call; call.answer(myStream);
        call.on('stream', (s) => { remoteVideo.srcObject = s; document.getElementById('searchingOverlay').classList.add('hidden-screen'); });
    });
}

socket.on('matched', ({ partnerPeerId, role, partnerSocketId: pSid }) => {
    partnerSocketId = pSid;
    chatBox.innerHTML = ""; // Clear chat on new match
    if (role === 'initiator') {
        setTimeout(() => {
            const call = peer.call(partnerPeerId, myStream);
            currentCall = call;
            call.on('stream', (s) => { remoteVideo.srcObject = s; document.getElementById('searchingOverlay').classList.add('hidden-screen'); });
        }, 1500);
    }
});

// Chat Logic
function sendMessage() {
    const msg = msgInput.value;
    if(!msg || !partnerSocketId) return;
    addMessage("You: " + msg, "text-pink-400");
    socket.emit('send-msg', { to: partnerSocketId, msg: msg });
    msgInput.value = "";
}

socket.on('receive-msg', (msg) => {
    addMessage("Stranger: " + msg, "text-white");
});

function addMessage(text, color) {
    const p = document.createElement('p');
    p.className = `text-[12px] font-bold ${color} bg-black/40 px-2 py-1 rounded w-fit`;
    p.innerText = text;
    chatBox.appendChild(p);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Controls Logic
window.toggleMic = () => {
    isMuted = !isMuted;
    myStream.getAudioTracks()[0].enabled = !isMuted;
    document.getElementById('micBtn').innerText = isMuted ? '🔇' : '🎤';
};

window.toggleVideo = () => {
    isVidOff = !isVidOff;
    myStream.getVideoTracks()[0].enabled = !isVidOff;
    document.getElementById('vidBtn').innerText = isVidOff ? '🚫' : '📷';
};

window.switchCamera = async () => {
    currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
    myStream.getTracks().forEach(track => track.stop());
    myStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacingMode }, audio: true });
    localVideo.srcObject = myStream;
    if(currentCall) {
        const videoTrack = myStream.getVideoTracks()[0];
        const sender = currentCall.peerConnection.getSenders().find(s => s.track.kind === 'video');
        sender.replaceTrack(videoTrack);
    }
};

window.handleNext = () => {
    if(currentCall) currentCall.close();
    remoteVideo.srcObject = null;
    partnerSocketId = null;
    document.getElementById('searchingOverlay').classList.remove('hidden-screen');
    socket.emit('join', { peerId: myPeerId, gender: myGender, filter: myFilter });
};
