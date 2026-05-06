const socket = io();
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const statusDiv = document.getElementById('status');
const searchingOverlay = document.getElementById('searchingOverlay');

let myStream;
let peer;
let myPeerId;
let currentCall;
let myGender = 'male';
let myFilter = 'any';

// 1. Online Count
socket.on('online-count', (count) => {
    document.getElementById('onlineCount').innerText = count;
});

window.setGender = (g) => {
    myGender = g;
    document.getElementById('mBtn').className = g === 'male' ? 'flex-1 bg-indigo-600 p-4 rounded-2xl border-2 border-white' : 'flex-1 bg-zinc-800 p-4 rounded-2xl border-2 border-transparent';
    document.getElementById('fBtn').className = g === 'female' ? 'flex-1 bg-pink-600 p-4 rounded-2xl border-2 border-white' : 'flex-1 bg-zinc-800 p-4 rounded-2xl border-2 border-transparent';
};

// 2. Start Button
window.handleStart = async () => {
    const name = document.getElementById('userName').value;
    if(!name) return alert("Naam dalo bhai!");
    
    document.getElementById('loginScreen').classList.add('hidden-screen');
    document.getElementById('chatInterface').classList.remove('hidden-screen');

    try {
        myStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = myStream;
        
        // PeerJS Setup
        peer = new Peer(undefined, {
            config: { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }
        });

        peer.on('open', (id) => {
            myPeerId = id;
            console.log("My ID: " + id);
            handleNext(); // First Search
        });

        // Jab koi dusra call kare
        peer.on('call', (call) => {
            console.log("Receiving call...");
            currentCall = call;
            call.answer(myStream);
            call.on('stream', (strangerStream) => {
                showVideo(strangerStream);
            });
        });

    } catch (e) {
        alert("Camera error! Please refresh.");
    }
};

// 3. Matching Logic
socket.on('matched', (partnerPeerId) => {
    console.log("Matched with: " + partnerPeerId);
    statusDiv.innerText = "Connecting...";
    
    // Thoda delay taaki connection miss na ho
    setTimeout(() => {
        const call = peer.call(partnerPeerId, myStream);
        currentCall = call;
        call.on('stream', (strangerStream) => {
            showVideo(strangerStream);
        });
    }, 1000); 
});

function showVideo(stream) {
    console.log("Showing Stranger Video");
    remoteVideo.srcObject = stream;
    remoteVideo.play();
    searchingOverlay.classList.add('hidden-screen');
    statusDiv.innerText = "Connected! 😍";
}

window.handleNext = () => {
    console.log("Searching next...");
    if(currentCall) currentCall.close();
    remoteVideo.srcObject = null;
    searchingOverlay.classList.remove('hidden-screen');
    statusDiv.innerText = "Searching Worldwide...";
    
    socket.emit('join', { 
        peerId: myPeerId, 
        gender: myGender, 
        filter: myFilter 
    });
};

window.changeFilter = (f) => {
    myFilter = f;
    document.getElementById('anyFilter').className = f === 'any' ? 'bg-indigo-600 px-6 py-2 rounded-full text-[10px] font-bold' : 'bg-zinc-900 px-6 py-2 rounded-full text-[10px] font-bold';
    document.getElementById('girlFilter').className = f === 'girl' ? 'bg-pink-600 px-6 py-2 rounded-full text-[10px] font-bold' : 'bg-zinc-900 px-6 py-2 rounded-full text-[10px] font-bold';
};
