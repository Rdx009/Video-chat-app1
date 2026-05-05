const socket = io();
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const statusDiv = document.getElementById('status');
const startBtn = document.getElementById('startBtn');

let myStream, peer, partnerPeerId, nsfwModel;
let myGender = 'male';
let selectedFilter = 'any';

// Load AI Moderation
console.log("Loading AI...");
nsfwjs.load().then(m => { 
    nsfwModel = m; 
    console.log("AI Model Loaded Successfully");
});

function setGender(g) {
    myGender = g;
    document.getElementById('mBtn').style.borderColor = g === 'male' ? '#4f46e5' : 'transparent';
    document.getElementById('fBtn').style.borderColor = g === 'female' ? '#4f46e5' : 'transparent';
}

// START BUTTON CLICK
startBtn.onclick = async () => {
    console.log("Start button clicked");
    const nameInput = document.getElementById('userName').value;
    
    if(!nameInput) {
        alert("Bhai apna naam toh likho!");
        return;
    }

    try {
        console.log("Requesting Camera...");
        statusDiv.innerText = "Accessing Camera...";
        
        myStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: true 
        });
        
        console.log("Camera Access Granted");
        localVideo.srcObject = myStream;
        document.getElementById('loginScreen').style.display = 'none';
        
        initPeer();
    } catch (e) { 
        console.error("Camera Error:", e);
        alert("Camera Error: Bhai camera aur mic ko 'Allow' karna zaroori hai settings se!"); 
    }
};

function initPeer() {
    peer = new Peer(undefined, {
        config: { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }
    });

    peer.on('open', (id) => {
        console.log("My Peer ID:", id);
        statusDiv.innerText = "Online - Press NEXT to match";
        
        document.getElementById('nextBtn').onclick = () => {
            console.log("Searching for stranger...");
            statusDiv.innerText = "Searching for Stranger...";
            remoteVideo.srcObject = null;
            socket.emit('join', { peerId: id, gender: myGender, filter: selectedFilter });
        };
    });

    peer.on('call', call => {
        console.log("Receiving call...");
        call.answer(myStream);
        call.on('stream', s => {
            remoteVideo.srcObject = s;
            statusDiv.innerText = "Connected with Stranger";
        });
    });

    socket.on('matched', (id) => {
        console.log("Matched with:", id);
        partnerPeerId = id;
        statusDiv.innerText = "Connecting to partner...";
        const call = peer.call(id, myStream);
        call.on('stream', s => {
            remoteVideo.srcObject = s;
            statusDiv.innerText = "Connected with Stranger";
        });
    });

    socket.on('banned', (msg) => { 
        alert(msg); 
        location.reload(); 
    });
}

// Nudity Detection Logic
setInterval(async () => {
    if (nsfwModel && remoteVideo.srcObject) {
        const predictions = await nsfwModel.classify(remoteVideo);
        const porn = predictions.find(p => p.className === 'Porn' || p.className === 'Hentai');
        if (porn && porn.probability > 0.70) {
            console.log("Nudity detected! Reporting...");
            reportStranger();
        }
    }
}, 3000);

function reportStranger() {
    if (partnerPeerId) socket.emit('report-user', partnerPeerId);
    remoteVideo.srcObject = null;
    statusDiv.innerText = "User Reported & Skipped";
    setTimeout(() => document.getElementById('nextBtn').click(), 1000);
}

document.getElementById('reportBtn').onclick = reportStranger;

function changeFilter(f) {
    selectedFilter = f;
    document.getElementById('anyFilter').className = f === 'any' ? 'bg-indigo-600 px-6 py-2 rounded-full text-xs font-bold' : 'bg-zinc-900 px-6 py-2 rounded-full text-xs font-bold';
    document.getElementById('girlFilter').className = f === 'girl' ? 'bg-pink-600 px-6 py-2 rounded-full text-xs font-bold' : 'bg-zinc-900 px-6 py-2 rounded-full text-xs font-bold';
}
