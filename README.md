# Inxperiments Mahendra Labs

**Inxperiments Mahendra Labs** is a "text-to-simulation" sandbox demonstrating Gemini's advanced reasoning and multi-modal capabilities. Users provide a natural language prompt describing a scenario, and the application translates it into a sequence of actions visualized in a 3D environment with multiple AI agents.

This project showcases the power of function calling to create structured plans from unstructured text and uses text-to-speech to bring the AI agents to life.

## Core Features

-   **Natural Language Input**: Describe complex scenarios in plain English.
-   **AI Director**: A Gemini model acts as a "Director," interpreting the prompt and creating a step-by-step action plan for the simulation.
-   **3D Visualization**: The simulation is rendered in a 3D environment using React Three Fiber, providing a dynamic and engaging visual representation of the AI's plan.
-   **Autonomous Agents**: Four AI agents (Alpha, Beta, Gamma, Delta) execute the Director's commands within the 3D sandbox.
-   **Agent Communication**: Agents can "speak" using Gemini's Text-to-Speech (TTS) capabilities, making the simulation more interactive and providing audible feedback on their actions.
-   **Live Transcript**: All actions from the User, the AI Director, and the agents are logged in a real-time transcript.

## How It Works

1.  **User Prompt**: The user enters a high-level command, like "Build a tower in the center," or selects a pre-made example.
2.  **Planning Phase (Function Calling)**: The prompt is sent to the `gemini-2.5-pro` model, which is given a "system instruction" to act as a simulation director. It has access to a set of predefined functions (`spawnObject`, `moveCharacter`, `logMessage`, etc.). The model uses **function calling** to break down the user's request into a precise, ordered list of these function calls.
3.  **Execution Phase**: The React frontend receives this list of actions and executes them sequentially with a delay between each step to allow for clear visualization.
4.  **Agent Speech (TTS)**: When a `logMessage` action is executed, the message text is sent to the `gemini-2.5-flash-preview-tts` model. The model generates audio for the specified agent's voice, which is then played in the browser.
5.  **Rendering**: The state of all characters and objects is managed in React and rendered in the 3D scene via `@react-three/fiber`. State changes (like new positions) are animated smoothly.

## Technology Stack

-   **Frontend Framework**: React with TypeScript
-   **Styling**: Tailwind CSS
-   **3D Rendering**:
    -   `three.js`
    -   `@react-three/fiber` (React renderer for three.js)
    -   `@react-three/drei` (Helpers for @react-three/fiber)
    -   `@react-spring/three` (Physics-based animations)
-   **AI & ML**:
    -   `@google/genai` for interacting with the Google Gemini API.
    -   **Model (Planning)**: `gemini-2.5-pro` for its advanced reasoning and function calling.
    -   **Model (Speech)**: `gemini-2.5-flash-preview-tts` for real-time text-to-speech generation.

## How to Use the App

1.  **Provide a Prompt**: Write your own instructions in the "Experiment Prompt" text area, or click the **Randomize Example** button to load a pre-written scenario.
2.  **Start the Experiment**: Click the **Start Experiment** button.
3.  **Observe**:
    -   The button will change to "Planning..." while Gemini generates the action plan.
    -   Once the plan is received, it will change to "Simulating..." and you will see the agents and objects move in the 3D scene.
    -   The **Live Transcript** on the left will show all actions as they are planned and executed.
    -   Listen for the agents to speak their logged messages.
4.  **Interact with the Scene**: You can click and drag in the 3D view to rotate the camera, scroll to zoom, and right-click to pan.
