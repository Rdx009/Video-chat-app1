const socket = io();
let myStream, peer, myGender = 'male', myFilter = 'any';

// Online Count update
socket.on('online-count', (count) => {
    document.getElementById('onlineCount').innerText = count;
});

window.setGender = (g) => {
    myGender = g;
    document.getElementById('mBtn').className = g === 'male' ? 'flex-1 bg-indigo-600 p-4 rounded-2xl border-2 border-white' : 'flex-1 bg-zinc-800 p-4 rounded-2xl border-2 border-transparent';
    document.getElementById('fBtn').className = g === 'female' ? 'flex-1 bg-pink-600 p-4 rounded-2xl border-2 border-white' : 'flex-1 bg-zinc-800 p-4 rounded-2xl border-2 border-transparent';
};

window.handleStart = async () => {
    if(!document.getElementById('userName').value) return alert("Please enter name");
    
    document.getElementById('loginScreen').classList.add('hidden-screen');
    document.getElementById('chatInterface').classList.remove('hidden-screen');

    try {
        myStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('localVideo').srcObject = myStream;
        initPeerJS();
    } catch (e) { alert("Camera Error!"); location.reload(); }
};

function initPeerJS() {
    peer = new Peer(undefined, { config: { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] } });

    peer.on('open', (id) => {
        // Automatically start searching
        handleNext();
    });

    peer.on('call', (call) => {
        call.answer(myStream);
        call.on('stream', (s) => {
            document.getElementById('remoteVideo').srcObject = s;
            document.getElementById('searchingOverlay').classList.add('hidden-screen');
        });
    });
}

window.handleNext = () => {
    document.getElementById('remoteVideo').srcObject = null;
    document.getElementById('searchingOverlay').classList.remove('hidden-screen');
    socket.emit('join', { peerId: peer.id, gender: myGender, filter: myFilter });
};

socket.on('matched', (id) => {
    const call = peer.call(id, myStream);
    call.on('stream', (s) => {
        document.getElementById('remoteVideo').srcObject = s;
        document.getElementById('searchingOverlay').classList.add('hidden-screen');
    });
});

window.changeFilter = (f) => {
    myFilter = f;
    document.getElementById('anyFilter').className = f === 'any' ? 'bg-indigo-600 px-6 py-2 rounded-full text-[10px] font-bold' : 'bg-zinc-900 px-6 py-2 rounded-full text-[10px] font-bold';
    document.getElementById('girlFilter').className = f === 'girl' ? 'bg-pink-600 px-6 py-2 rounded-full text-[10px] font-bold' : 'bg-zinc-900 px-6 py-2 rounded-full text-[10px] font-bold';
};
