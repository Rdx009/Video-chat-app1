const socket = io();
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const statusDiv = document.getElementById('status');

let myStream, peer, partnerPeerId, nsfwModel;
let myGender = 'male';
let selectedFilter = 'any';

// Load AI
nsfwjs.load().then(m => { nsfwModel = m; console.log("AI Model Loaded"); });

function setGender(g) {
    myGender = g;
    document.getElementById('mBtn').style.borderColor = g === 'male' ? '#4f46e5' : 'transparent';
    document.getElementById('fBtn').style.borderColor = g === 'female' ? '#4f46e5' : 'transparent';
}

document.getElementById('startBtn').onclick = async () => {
    const name = document.getElementById('userName').value;
    if(!name) return alert("Please enter name");

    try {
        myStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = myStream;
        document.getElementById('loginScreen').style.display = 'none';
        initPeer();
    } catch (e) { alert("Camera access required!"); }
};

function initPeer() {
    peer = new Peer(undefined, { config: { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] } });

    peer.on('open', (id) => {
        statusDiv.innerText = "Ready to search";
        
        document.getElementById('nextBtn').onclick = () => {
            statusDiv.innerText = "Searching...";
            remoteVideo.srcObject = null;
            socket.emit('join', { peerId: id, gender: myGender, filter: selectedFilter });
        };
    });

    peer.on('call', call => {
        call.answer(myStream);
        call.on('stream', s => {
            remoteVideo.srcObject = s;
            statusDiv.innerText = "Connected";
        });
    });

    socket.on('matched', (id) => {
        partnerPeerId = id;
        statusDiv.innerText = "Connecting...";
        const call = peer.call(id, myStream);
        call.on('stream', s => {
            remoteVideo.srcObject = s;
            statusDiv.innerText = "Connected";
        });
    });

    socket.on('banned', (msg) => { alert(msg); location.reload(); });
}

// AI Nudity Detection
setInterval(async () => {
    if (nsfwModel && remoteVideo.srcObject) {
        const predictions = await nsfwModel.classify(remoteVideo);
        const porn = predictions.find(p => p.className === 'Porn' || p.className === 'Hentai');
        if (porn && porn.probability > 0.75) {
            alert("Nudity Detected! Call terminated.");
            reportStranger();
        }
    }
}, 3000);

function reportStranger() {
    if (partnerPeerId) socket.emit('report-user', partnerPeerId);
    remoteVideo.srcObject = null;
    statusDiv.innerText = "Stranger Reported";
    setTimeout(() => document.getElementById('nextBtn').click(), 1000);
}

document.getElementById('reportBtn').onclick = reportStranger;

function changeFilter(f) {
    selectedFilter = f;
    document.getElementById('anyFilter').className = f === 'any' ? 'bg-indigo-600 px-6 py-2 rounded-full text-xs font-bold' : 'bg-zinc-900 px-6 py-2 rounded-full text-xs font-bold';
    document.getElementById('girlFilter').className = f === 'girl' ? 'bg-pink-600 px-6 py-2 rounded-full text-xs font-bold' : 'bg-zinc-900 px-6 py-2 rounded-full text-xs font-bold';
}
