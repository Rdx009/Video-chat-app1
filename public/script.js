const socket = io();
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const searchingOverlay = document.getElementById('searchingOverlay');
const loginScreen = document.getElementById('loginScreen');
const chatInterface = document.getElementById('chatInterface');

let myStream, peer, myPeerId, currentCall;
let myGender = 'male', myFilter = 'any';

socket.on('online-count', (count) => {
    document.getElementById('onlineCount').innerText = count;
});

window.setGender = (g) => {
    myGender = g;
    document.getElementById('mBtn').className = g === 'male' ? 'flex-1 bg-indigo-600 p-4 rounded-2xl border-2 border-white font-bold' : 'flex-1 bg-zinc-800 p-4 rounded-2xl border-2 border-transparent font-bold';
    document.getElementById('fBtn').className = g === 'female' ? 'flex-1 bg-pink-600 p-4 rounded-2xl border-2 border-white font-bold' : 'flex-1 bg-zinc-800 p-4 rounded-2xl border-2 border-transparent font-bold';
};

// --- YEAH HAI MAIN CHANGE ---
window.handleStart = async () => {
    const name = document.getElementById('userName').value;
    if(!name) return alert("Bhai naam toh dalo!");

    try {
        // 1. Pehle Camera Mangega
        myStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = myStream;
        
        // 2. Camera milte hi screen change hogi
        loginScreen.classList.add('hidden-screen');
        chatInterface.classList.remove('hidden-screen');

        // 3. PeerJS ko tabhi chalu karenge jab camera mil jayega
        initPeerJS();
    } catch (e) {
        alert("Camera Permission Required! Settings se allow karein.");
    }
};

function initPeerJS() {
    peer = new Peer(undefined, {
        config: { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }
    });

    peer.on('open', (id) => {
        myPeerId = id;
        // 4. Peer ID milne ke BAAD hi pehli baar search karega
        handleNext();
    });

    peer.on('call', (call) => {
        currentCall = call;
        call.answer(myStream);
        call.on('stream', (s) => {
            remoteVideo.srcObject = s;
            searchingOverlay.classList.add('hidden-screen');
        });
    });
}

// Matching Logic (Smart Roles)
socket.on('matched', ({ partnerPeerId, role }) => {
    if (role === 'initiator') {
        setTimeout(() => {
            const call = peer.call(partnerPeerId, myStream);
            currentCall = call;
            call.on('stream', (s) => {
                remoteVideo.srcObject = s;
                searchingOverlay.classList.add('hidden-screen');
            });
        }, 1500);
    }
});

window.handleNext = () => {
    if(currentCall) currentCall.close();
    remoteVideo.srcObject = null;
    searchingOverlay.classList.remove('hidden-screen');
    socket.emit('join', { peerId: myPeerId, gender: myGender, filter: myFilter });
};

window.changeFilter = (f) => {
    myFilter = f;
    document.getElementById('anyFilter').className = f === 'any' ? 'bg-indigo-600 px-6 py-2 rounded-full text-xs font-bold border border-white/10' : 'bg-zinc-900 px-6 py-2 rounded-full text-xs font-bold border border-white/10';
    document.getElementById('girlFilter').className = f === 'girl' ? 'bg-pink-600 px-6 py-2 rounded-full text-xs font-bold border border-white/10' : 'bg-zinc-900 px-6 py-2 rounded-full text-xs font-bold border border-white/10';
};
