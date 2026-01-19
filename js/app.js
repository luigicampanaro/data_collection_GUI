// --- Configuration ---
const DEFAULT_IP = 'localhost';
const DEFAULT_PORT = '9091';

function getRosUrl() {
    const ip = localStorage.getItem('ros_ip') || DEFAULT_IP;
    const port = localStorage.getItem('ros_port') || DEFAULT_PORT;
    return `ws://${ip}:${port}`;
}

// --- State Management ---
const STATE = {
    IDLE: 'idle',
    RECORDING: 'recording'
};

let currentState = STATE.IDLE;
let ros = null;
let toggleClient = null;
let deleteClient = null;

// --- UI Elements ---
const ui = {
    statusDot: document.getElementById('connection-status'),
    btnStart: document.getElementById('btn-start'),
    btnStop: document.getElementById('btn-stop'),
    btnDelete: document.getElementById('btn-delete'),
    
    // Modals
    modal: document.getElementById('modal-overlay'),
    settingsModal: document.getElementById('settings-modal-overlay'),
    
    // Modal Buttons
    btnCancel: document.getElementById('btn-cancel'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),
    btnCancelSettings: document.getElementById('btn-cancel-settings'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    
    // Inputs & Triggers
    btnSettings: document.getElementById('btn-settings'),
    inputIp: document.getElementById('input-ip'),
    inputPort: document.getElementById('input-port'),
    
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
    const url = getRosUrl();
    console.log(`Connecting to ROS at ${url}`);
    
    ros = new ROSLIB.Ros({
        url: url
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

    toggleClient = new ROSLIB.Service({
        ros: ros,
        name: '/collection_toggle',
        serviceType: 'std_srvs/srv/SetBool'
    });

    deleteClient = new ROSLIB.Service({
        ros: ros,
        name: '/collection_delete',
        serviceType: 'std_srvs/srv/Trigger'
    });
}

// --- Logic & Guards ---

function handleStart() {
    if (currentState === STATE.RECORDING) return; // Guard
    
    const request = new ROSLIB.ServiceRequest({
        data: true
    });

    toggleClient.callService(request, (result) => {
        if (result.success) {
            console.log('Start success:', result.message);
            currentState = STATE.RECORDING;
            updateUI();
        } else {
            console.error('Start failed:', result.message);
        }
    });
}

function handleStop() {
    if (currentState === STATE.IDLE) return; // Guard
    
    const request = new ROSLIB.ServiceRequest({
        data: false
    });

    toggleClient.callService(request, (result) => {
        if (result.success) {
            console.log('Stop success:', result.message);
            currentState = STATE.IDLE;
            updateUI();
        } else {
            console.error('Stop failed:', result.message);
        }
    });
}

function openDeleteModal() {
    ui.modal.classList.remove('hidden');
}

function closeDeleteModal() {
    ui.modal.classList.add('hidden');
}

function openSettings() {
    ui.inputIp.value = localStorage.getItem('ros_ip') || DEFAULT_IP;
    ui.inputPort.value = localStorage.getItem('ros_port') || DEFAULT_PORT;
    ui.settingsModal.classList.remove('hidden');
}

function closeSettings() {
    ui.settingsModal.classList.add('hidden');
}

function saveSettings() {
    const ip = ui.inputIp.value.trim();
    const port = ui.inputPort.value.trim();
    
    if (ip) localStorage.setItem('ros_ip', ip);
    if (port) localStorage.setItem('ros_port', port);
    
    closeSettings();
    location.reload(); // Simple reload to reconnect
}

function confirmDelete() {
    const request = new ROSLIB.ServiceRequest({});

    deleteClient.callService(request, (result) => {
        if (result.success) {
            console.log('Delete success:', result.message);
            closeDeleteModal();
        } else {
            console.error('Delete failed:', result.message);
            alert('Delete failed: ' + result.message);
        }
    });
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

    // Settings Events
    ui.btnSettings.addEventListener('click', openSettings);
    ui.btnCancelSettings.addEventListener('click', closeSettings);
    ui.btnSaveSettings.addEventListener('click', saveSettings);

    // Close modal on background click
    ui.modal.addEventListener('click', (e) => {
        if (e.target === ui.modal) closeDeleteModal();
    });
    
    ui.settingsModal.addEventListener('click', (e) => {
        if (e.target === ui.settingsModal) closeSettings();
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