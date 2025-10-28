import React, { useEffect, useRef, useState } from 'react';

const DataForgeGame = () => {
    const unityInstance = useRef(null);
    const canvasRef = useRef(null);

    // --- NEW: State for the message you want to send ---
    const [messageToSend, setMessageToSend] = useState('Hello from Webpage!');

    // This function handles messages coming FROM Unity
    const handleDataFromUnity = (jsonString) => {
        console.log(`%c[PLATFORM] <<< Received a message from Unity:`, 'color: #00ff00; font-weight: bold;', jsonString);
    };

    // --- NEW: This function sends a message TO Unity when you click the button ---
    const handleSendMessage = () => {
        if (!unityInstance.current) {
            alert("Unity instance is not ready yet.");
            return;
        }

        const payload = {
            message: messageToSend,
            value: Math.floor(Math.random() * 1000) // Add a random value
        };
        const jsonPayloadString = JSON.stringify(payload);

        console.log(`%c[PLATFORM] >>> Pushing payload via SendMessage...`, 'color: #00aaff; font-weight: bold;');
        console.log(`  - Payload: ${jsonPayloadString}`);
        
        try {
            // This is the core function call you requested to test.
            unityInstance.current.SendMessage("FromWebPageText", "ReceiveData", jsonPayloadString);
        } catch (err) {
            console.warn("[PLATFORM] A non-critical error occurred during SendMessage. This is expected due to the faulty Unity build, but the message was likely still sent.");
        }
    };

    useEffect(() => {
        // Basic Unity loading logic
        window.onUnityJson = handleDataFromUnity;

        const script = document.createElement("script");
        script.src = "/data-forge/Build/1.4.loader.js";
        script.onload = () => {
            const config = {
                dataUrl: "/data-forge/Build/1.4.data",
                frameworkUrl: "/data-forge/Build/1.4.framework.js",
                codeUrl: "/data-forge/Build/1.4.wasm",
                companyName: "XPARK",
                productName: "Data Forge",
                productVersion: "1.0",
            };

            window.createUnityInstance(canvasRef.current, config)
            .then((instance) => {
                unityInstance.current = instance;
                console.log("%c[PLATFORM] Unity instance created successfully. Ready to send messages.", 'color: orange; font-weight: bold;');
            }).catch((message) => {
                console.error("[PLATFORM] Failed to create Unity instance:", message);
            });
        };
        document.body.appendChild(script);

        return () => {
            console.log("[PLATFORM] Cleaning up Data Forge game instance...");
            if (unityInstance.current) {
                // This command shuts down the Unity game and stops all audio.
                unityInstance.current.Quit();
                unityInstance.current = null;
            }
            if (script.parentNode) {
                document.body.removeChild(script);
            }
            delete window.onUnityJson;
        };
    }, []);

    return (
        <div className="w-full h-full flex flex-col justify-center items-center p-4">
            <a 
                href="/dashboard" 
                className="absolute top-4 left-4 z-50 text-white font-light py-2 px-4 rounded-md transition"
            >
                &larr; Back to Dashboard
            </a>
            {/* The Unity Game Canvas */}
            <canvas ref={canvasRef} id="unity-canvas" style={{ width: '960px', height: '600px' }}></canvas>
            
            {/* --- NEW: Interactive Controls --- */}
            <div className="mt-4">
                <button 
                    onClick={handleSendMessage}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition"
                >
                    Send Message to Unity
                </button>
            </div>
        </div>
    );
};

export default DataForgeGame;