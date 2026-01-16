// --- Configuration ---
const ROS_BRIDGE_URL = 'ws://localhost:9091';
const TOPIC_NAME = '/collection_commands';

// --- State Management ---
const STATE = {
    IDLE: 'idle',
    RECORDING: 'recording'
};

let currentState = STATE.IDLE;
let ros = null;
let cmdTopic = null;

// --- UI Elements ---
const ui = {
    statusDot: document.getElementById('connection-status'),
    btnStart: document.getElementById('btn-start'),
    btnStop: document.getElementById('btn-stop'),
    btnDelete: document.getElementById('btn-delete'),
    modal: document.getElementById('modal-overlay'),
    btnCancel: document.getElementById('btn-cancel'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),
    buttons: document.querySelectorAll('button') // For physics handlers
};

// --- Initialization ---
function init() {
    initRos();
    setupEventListeners();
    setupPhysics();
    updateUI();
}

function initRos() {
    ros = new ROSLIB.Ros({
        url: ROS_BRIDGE_URL
    });

    ros.on('connection', () => {
        console.log('Connected to websocket server.');
        ui.statusDot.classList.add('connected');
    });

    ros.on('error', (error) => {
        console.log('Error connecting to websocket server: ', error);
        ui.statusDot.classList.remove('connected');
    });

    ros.on('close', () => {
        console.log('Connection to websocket server closed.');
        ui.statusDot.classList.remove('connected');
    });

    cmdTopic = new ROSLIB.Topic({
        ros: ros,
        name: TOPIC_NAME,
        messageType: 'std_msgs/String'
    });
}

function publishCommand(data) {
    if (!cmdTopic) return;
    const msg = new ROSLIB.Message({
        data: data
    });
    cmdTopic.publish(msg);
    console.log(`Published: ${data}`);
}

// --- Logic & Guards ---

function handleStart() {
    if (currentState === STATE.RECORDING) return; // Guard
    
    currentState = STATE.RECORDING;
    publishCommand('start');
    updateUI();
}

function handleStop() {
    if (currentState === STATE.IDLE) return; // Guard
    
    currentState = STATE.IDLE;
    publishCommand('stop');
    updateUI();
}

function openDeleteModal() {
    ui.modal.classList.remove('hidden');
}

function closeDeleteModal() {
    ui.modal.classList.add('hidden');
}

function confirmDelete() {
    publishCommand('delete');
    closeDeleteModal();
}

function updateUI() {
    // Toggle active states based on current Logic State
    if (currentState === STATE.RECORDING) {
        ui.btnStart.classList.add('active');
        ui.btnStop.classList.remove('active');
        
        // Optional: Disable Delete while recording? 
        // Not explicitly asked, but safe UX. Leaving enabled per strict prompt specs.
    } else {
        ui.btnStart.classList.remove('active');
        ui.btnStop.classList.add('active'); // In idle, Stop is "engaged" or just Start is ready?
        // Prompt says: "When active... look physically depressed".
        // Usually "Stop" isn't active in Idle, it's just available. 
        // BUT, mutually exclusive usually means one is ON. 
        // Let's re-read: "START and STOP toggle each other."
        // If I am NOT recording, am I "Stopped"? Yes.
        // If I click Stop while Idle -> "The same applies to STOP if already 'idle'".
        // This implies Stop is ALREADY the state.
        // So visually, STOP should be active when IDLE.
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    ui.btnStart.addEventListener('click', handleStart);
    ui.btnStop.addEventListener('click', handleStop);
    
    ui.btnDelete.addEventListener('click', openDeleteModal);
    ui.btnCancel.addEventListener('click', closeDeleteModal);
    ui.btnConfirmDelete.addEventListener('click', confirmDelete);

    // Close modal on background click
    ui.modal.addEventListener('click', (e) => {
        if (e.target === ui.modal) closeDeleteModal();
    });
}

// --- Physics (Micro-interactions) ---
// Purely visual: adds class on press, removes on release
function setupPhysics() {
    ui.buttons.forEach(btn => {
        const press = () => btn.classList.add('is-pressed');
        const release = () => btn.classList.remove('is-pressed');

        btn.addEventListener('mousedown', press);
        btn.addEventListener('mouseup', release);
        btn.addEventListener('mouseleave', release);

        btn.addEventListener('touchstart', press, {passive: true});
        btn.addEventListener('touchend', release);
    });
}

// Start
window.addEventListener('load', init);