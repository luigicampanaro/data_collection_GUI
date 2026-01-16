# Data Collection GUI

A highly polished, Apple HIG-inspired web interface for controlling data collection via ROS 2. This GUI provides a refined user experience with physics-based animations, 3D depth effects, and strict state guarding.

## Overview

This interface acts as a remote control for your ROS 2 data collection node. It connects via WebSocket using `roslibjs` and publishes simple string commands to control the recording process.

**Key Features:**
*   **Refined Design:** Apple-style aesthetics with diffused shadows, frosted glass effects, and SF Pro typography.
*   **Physics Animations:** Buttons react with spring-physics micro-interactions.
*   **State Guarding:** Prevents accidental double-starts or stops.
*   **Safety:** "Delete Last" functionality requires explicit confirmation via a modal.

## Prerequisites

*   **Python 3** (to serve the GUI locally).
*   **ROS 2** installed on your backend/robot.
*   **rosbridge_suite** package installed in your ROS environment.

## Setup & Usage

### 1. Start the ROS Bridge (Robot/Backend)
Ensure your ROS 2 environment is running and the `rosbridge_server` is active. This allows the web browser to communicate with ROS.

```bash
# Install rosbridge if needed
sudo apt install ros-<distro>-rosbridge-suite

# Launch the websocket server on port 9091
ros2 launch rosbridge_server rosbridge_websocket_launch.xml port:=9091
```

### 2. Serve the GUI (Host Machine)
You can serve the static files using Python's built-in HTTP server. Run this command from the root of this repository:

```bash
python3 -m http.server 8000
```

### 3. Access the Interface
Open your web browser and navigate to:

**[http://localhost:8000](http://localhost:8000)**

The status indicator in the top header will turn **Green** when successfully connected to the ROS bridge.

## Technical Details

*   **Connection:** WebSocket (`ws://localhost:9091`)
*   **ROS Topic:** `/collection_commands`
*   **Message Type:** `std_msgs/String`

### Commands
| Button | Command Sent | Description |
| :--- | :--- | :--- |
| **Start** | `'start'` | Triggers the start of data recording. |
| **Stop** | `'stop'` | Stops the current recording. |
| **Delete Last** | `'delete'` | Deletes the most recently created bag folder (requires confirmation). |

## Troubleshooting

*   **Status Dot is Grey:** The GUI cannot connect to the WebSocket. Ensure:
    *   The `rosbridge_server` is running.
    *   The port `9091` is exposed/accessible.
    *   You are not blocked by a firewall.
*   **Buttons not responding:** Check the browser console (`F12`) for logs. If the state is guarded (e.g., trying to Start while already Recording), the button press will be ignored by design.

## How to Run

### 1. Start the ROS Bridge

First, ensure your ROS 2 environment is running and `rosbridge_server` is active. This allows the web browser to communicate with ROS.

*   **Command:**
    ```bash
    # Launch the websocket server on port 9091
    ros2 launch rosbridge_server rosbridge_websocket_launch.xml port:=9091
    ```
*   **Note:** This command should be run within your ROS 2 container or environment where ROS 2 is accessible.

### 2. Serve the GUI Locally

Serve the static GUI files using Python's built-in HTTP server. This command should be run on your host machine, in the directory containing the GUI files (`index.html`, `css/`, `js/`).

*   **Command:**
    ```bash
    python3 -m http.server 8000
    ```

### 3. Access the Interface

Open your web browser and navigate to:

**[http://localhost:8000](http://localhost:8000)**

The status indicator in the top header will turn **Green** when successfully connected to the ROS bridge.
