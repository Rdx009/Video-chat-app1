const socket = io();
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const statusDiv = document.getElementById('status');
const searchingOverlay = document.getElementById('searchingOverlay');

let myStream;
let peer;
let currentCall;
let myGender = 'male';
let myFilter = 'any';

// Online Count
socket.on('online-count', (count) => {
    document.getElementById('onlineCount').innerText = count;
});

window.setGender = (g) => {
    myGender = g;
    document.getElementById('mBtn').className = g === 'male' ? 'flex-1 bg-indigo-600 p-4 rounded-2xl border-2 border-white' : 'flex-1 bg-zinc-800 p-4 rounded-2xl border-2 border-transparent';
    document.getElementById('fBtn').className = g === 'female' ? 'flex-1 bg-pink-600 p-4 rounded-2xl border-2 border-white' : 'flex-1 bg-zinc-800 p-4 rounded-2xl border-2 border-transparent';
};

window.handleStart = async () => {
    if(!document.getElementById('userName').value) return alert("Bhai naam toh dalo!");
    
    document.getElementById('loginScreen').classList.add('hidden-screen');
    document.getElementById('chatInterface').classList.remove('hidden-screen');

    try {
        // High Quality stream with specific constraints for mobile
        myStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: "user",
                width: { ideal: 640 },
                height: { ideal: 480 }
            }, 
            audio: true 
        });
        localVideo.srcObject = myStream;
        initPeerJS();
    } catch (e) { 
        alert("Camera Permission Error! Refresh karein."); 
        location.reload(); 
    }
};

function initPeerJS() {
    // Google ka best STUN server use kar rahe hain
    peer = new Peer(undefined, {
        config: { 'iceServers': [
            { 'urls': 'stun:stun.l.google.com:19302' },
            { 'urls': 'stun:stun1.l.google.com:19302' },
            { 'urls': 'stun:stun2.l.google.com:19302' }
        ] }
    });

    peer.on('open', (id) => {
        console.log("My Peer ID: " + id);
        handleNext(); // Auto start search
    });

    // Jab koi dusra hume call kare (RECEIVER)
    peer.on('call', (call) => {
        currentCall = call;
        // Apni stream bhejo aur uski stream lo
        call.answer(myStream);
        
        call.on('stream', (strangerStream) => {
            showRemoteVideo(strangerStream);
        });
    });
}

// Jab hum dusre ko call karein (INITIATOR)
socket.on('matched', (partnerPeerId) => {
    console.log("Matching with: " + partnerPeerId);
    const call = peer.call(partnerPeerId, myStream);
    currentCall = call;

    call.on('stream', (strangerStream) => {
        showRemoteVideo(strangerStream);
    });
});

// Video Play karne ka pakka tarika
function showRemoteVideo(stream) {
    remoteVideo.srcObject = stream;
    // Mobile browsers ke liye explicit play zaroori hai
    remoteVideo.onloadedmetadata = () => {
        remoteVideo.play().catch(e => console.error("Auto-play failed:", e));
    };
    searchingOverlay.classList.add('hidden-screen');
    statusDiv.innerText = "Matched! Say Hello 👋";
}

window.handleNext = () => {
    if(currentCall) currentCall.close();
    remoteVideo.srcObject = null;
    searchingOverlay.classList.remove('hidden-screen');
    statusDiv.innerText = "Searching Worldwide...";
    
    socket.emit('join', { 
        peerId: peer.id, 
        gender: myGender, 
        filter: myFilter 
    });
};

window.changeFilter = (f) => {
    myFilter = f;
    document.getElementById('anyFilter').className = f === 'any' ? 'bg-indigo-600 px-6 py-2 rounded-full text-[10px] font-bold' : 'bg-zinc-900 px-6 py-2 rounded-full text-[10px] font-bold';
    document.getElementById('girlFilter').className = f === 'girl' ? 'bg-pink-600 px-6 py-2 rounded-full text-[10px] font-bold' : 'bg-zinc-900 px-6 py-2 rounded-full text-[10px] font-bold';
};
