// Mobile Debugger Function
function logError(msg) {
    const debug = document.getElementById('debugLog');
    debug.innerText = msg;
    debug.classList.remove('hidden');
    console.error(msg);
}

// Global Variables
const socket = io();
let myStream = null;
let peer = null;
let partnerId = null;
let myGender = 'male';
let myFilter = 'any';

// Gender Selection
window.setGender = function(g) {
    myGender = g;
    document.getElementById('mBtn').className = g === 'male' ? 'flex-1 bg-indigo-600 p-4 rounded-2xl border-2 border-white' : 'flex-1 bg-zinc-800 p-4 rounded-2xl border-2 border-transparent';
    document.getElementById('fBtn').className = g === 'female' ? 'flex-1 bg-pink-600 p-4 rounded-2xl border-2 border-white' : 'flex-1 bg-zinc-800 p-4 rounded-2xl border-2 border-transparent';
};

// Start Button Handler
window.handleStart = async function() {
    const name = document.getElementById('userName').value;
    if(!name) return alert("Please enter your name");

    // 1. Instant UI Change (Sabse pehle screen badlo)
    document.getElementById('loginScreen').classList.add('hidden-screen');
    document.getElementById('chatInterface').classList.remove('hidden-screen');
    document.getElementById('status').innerText = "Starting Camera...";

    try {
        // 2. Camera Access
        myStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: true 
        });
        document.getElementById('localVideo').srcObject = myStream;
        
        // 3. Initialize Peer
        initPeerJS();

    } catch (err) {
        logError("Camera Fail: " + err.message);
        alert("Bhai Camera allow nahi kiya aapne! Refresh karke allow karein.");
    }
};

function initPeerJS() {
    document.getElementById('status').innerText = "Connecting to Server...";
    
    peer = new Peer(undefined, {
        config: { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }
    });

    peer.on('open', (id) => {
        document.getElementById('status').innerText = "Ready! Press NEXT to Match";
    });

    peer.on('call', (call) => {
        call.answer(myStream);
        call.on('stream', (remoteStream) => {
            document.getElementById('remoteVideo').srcObject = remoteStream;
            document.getElementById('status').innerText = "Connected with Stranger";
        });
    });

    peer.on('error', (err) => {
        logError("Peer Error: " + err.type);
    });
}

window.handleNext = function() {
    if(!peer || !peer.id) return alert("Still connecting, please wait...");
    
    document.getElementById('status').innerText = "Searching for Stranger...";
    document.getElementById('remoteVideo').srcObject = null;
    
    socket.emit('join', { 
        peerId: peer.id, 
        gender: myGender, 
        filter: myFilter 
    });
};

socket.on('matched', (id) => {
    partnerId = id;
    document.getElementById('status').innerText = "Stranger Found! Connecting...";
    const call = peer.call(id, myStream);
    call.on('stream', (remoteStream) => {
        document.getElementById('remoteVideo').srcObject = remoteStream;
        document.getElementById('status').innerText = "Connected with Stranger";
    });
});

window.changeFilter = function(f) {
    myFilter = f;
    document.getElementById('anyFilter').className = f === 'any' ? 'bg-indigo-600 px-6 py-2 rounded-full text-xs font-bold' : 'bg-zinc-900 px-6 py-2 rounded-full text-xs font-bold';
    document.getElementById('girlFilter').className = f === 'girl' ? 'bg-pink-600 px-6 py-2 rounded-full text-xs font-bold' : 'bg-zinc-900 px-6 py-2 rounded-full text-xs font-bold';
};
