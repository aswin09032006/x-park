// =================================================================================================
// START OF FILE: DataForgeGame.jsx
// --- This is the final version. It corrects the "new player" initial state. ---
// =================================================================================================

import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

const GAME_ID = "data-forge";
const UNITY_BUILD_DIR = `/${GAME_ID}/Build`;
const NUM_LEVELS = 5;
const LOCAL_STORAGE_KEY = 'gameData';

// --- LEVEL STATUS LOGIC ---
// This function correctly determines the status of each level based on saved progress.
const getStatusString = (level, completedLevels) => {
    // This is the correct logic for a returning player.
    if (completedLevels && completedLevels[String(level)]) {
        return "completed";
    }
    // Unity's own logic will handle unlocking the next level, so we only need to mark the rest as locked.
    return "locked";
};


const DataForgeGame = () => {
    const unityInstance = useRef(null);
    const canvasRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('Initializing...');

    // --- (The rest of the component remains unchanged as it is now working correctly) ---
    const progressDataCollector = useRef({});
    const collectionTimer = useRef(null);
    const saveState = useRef('IDLE');

    const log = (message, ...args) => console.log(`%c[React] ${message}`, 'color: #00dd00; font-weight: bold;', ...args);
    const errLog = (message, ...args) => console.error(`%c[React ERROR] ${message}`, 'color: #ff0000; font-weight: bold;', ...args);
    const interceptLog = (message, ...args) => console.log(`%c[INTERCEPTOR] ${message}`, 'color: #ff00ff; font-weight: bold;', ...args);
    const stateLog = (message, ...args) => console.log(`%c[STATE] ${message}`, 'color: #ff8c00; font-weight: bold;', ...args);

    const saveProgressToBackend = async (finalPayload) => {
        log('>>> SAVE PROCESS INITIATED >>>', finalPayload);
        try {
            await api(`/users/me/gamedata/data-forge`, 'POST', finalPayload);
            log('<<< BACKEND SAVE SUCCESSFUL <<<');
            // log('[STATE SYNC] Reloading page to apply new level progress.');
            // setTimeout(() => window.location.reload(), 500);
        } catch (err) {
            errLog('!!! BACKEND SAVE FAILED !!! API call returned an error.', err);
            setError("A network error occurred while saving your progress.");
        }
    };

    useEffect(() => {
        log('Component mounted. Initializing console interceptor.');

        const processAndSaveData = () => {
            stateLog('Collection timer finished. Finalizing and saving data.');
            const collectedData = progressDataCollector.current;
            const lastCompletedStage = collectedData.stages_completed?.filter(s => s.status === "completed").pop();

            if (!lastCompletedStage) {
                errLog('!!! SAVE FAILED !!! No "completed" stage was found in the collected data packets.');
            } else {
                const stageId = lastCompletedStage.stage_id;
                const finalPayload = {
                    stage: stageId,
                    status: 2,
                    score: collectedData.high_score?.find(h => h.stage_id === stageId)?.high_score || 0,
                    badge: collectedData.badges?.find(b => b.stage_id === stageId)?.badge_type || 0,
                    xp: collectedData.xp_earned?.find(x => x.stage_id === stageId)?.xp || 0,
                    certificate: stageId === NUM_LEVELS ? 1 : 0
                };
                saveProgressToBackend(finalPayload);
            }

            progressDataCollector.current = {};
            saveState.current = 'IDLE';
            stateLog('State reset to IDLE.');
        };

        const originalConsoleLog = console.log;
        console.log = (...args) => {
            originalConsoleLog(...args);
            const logString = args.join(' ');

            if (logString.includes("New Checkpoint: EndGame")) {
                interceptLog('"EndGame" checkpoint DETECTED.');
                saveState.current = 'ARMED';
                stateLog('State changed to ARMED. Now waiting for data packets...');
            }
            else if (logString.startsWith("Unity sent JSON to page:")) {
                interceptLog('Data packet detected.');
                if (saveState.current === 'IDLE') {
                    stateLog('Current state is IDLE. Ignoring this packet as it is not post-EndGame.');
                    return;
                }

                try {
                    const jsonString = logString.substring(logString.indexOf('{'));
                    const packet = JSON.parse(jsonString);
                    if (packet.data) {
                        if (saveState.current === 'ARMED') {
                            stateLog('State is ARMED. This is the first valid packet. Starting collection timer.');
                            saveState.current = 'COLLECTING';
                            stateLog('State changed to COLLECTING.');
                        }
                        
                        interceptLog('Merging packet into collector:', packet.data);
                        Object.assign(progressDataCollector.current, packet.data);

                        clearTimeout(collectionTimer.current);
                        collectionTimer.current = setTimeout(processAndSaveData, 300);
                    }
                } catch (e) {
                    errLog("Failed to parse JSON from intercepted console log.", e);
                }
            }
        };

        const initializeGame = async () => {
            try {
                const userGameData = await api('/users/me/gamedata/data-forge');
                log('[INIT] Loaded user progress from backend:', userGameData);
                const stages_completed = [];
                const high_score = [];
                const isNewPlayer = !userGameData.completedLevels || Object.keys(userGameData.completedLevels).length === 0;

                // --- THE FINAL CRITICAL FIX ---
                if (isNewPlayer) {
                    log("[INIT] New player detected. Sending completely empty 'stages_completed' array to rely on Unity's internal default state.");
                    // By doing nothing here, 'stages_completed' remains an empty array.
                    // This prevents us from sending the 'unlocked' status that breaks Unity's logic.
                } else {
                    log('[INIT] Returning player. Building level status from saved data.');
                    for (let i = 1; i <= NUM_LEVELS; i++) {
                        stages_completed.push({ stage_id: i, status: getStatusString(i, userGameData.completedLevels) });
                    }
                    if (userGameData.highScores) {
                        for (const stageId in userGameData.highScores) {
                            high_score.push({ stage_id: parseInt(stageId), high_score: userGameData.highScores[stageId] });
                        }
                    }
                }

                const initData = JSON.stringify({ data: { stages_completed, high_score } });
                log('[INIT] Sending final state to Unity via localStorage:', initData);
                window.localStorage.setItem(LOCAL_STORAGE_KEY, initData);
                
                const script = document.createElement("script");
                script.id = 'unity-loader-script';
                script.src = `${UNITY_BUILD_DIR}/DataForge50_json.loader.js`;
                script.async = true;
                document.body.appendChild(script);

                script.onload = () => {
                    const config = {
                        dataUrl: `${UNITY_BUILD_DIR}/DataForge50_json.data.br`,
                        frameworkUrl: `${UNITY_BUILD_DIR}/DataForge50_json.framework.js.br`,
                        codeUrl: `${UNITY_BUILD_DIR}/DataForge50_json.wasm.br`,
                        companyName: "XPARK", productName: "Data Forge", productVersion: "1.4",
                    };
                    window.createUnityInstance(canvasRef.current, config, (p) => setLoadingMessage(`Loading Game... ${Math.round(p * 100)}%`))
                    .then((instance) => {
                        unityInstance.current = instance;
                        setIsLoading(false);
                        log("[INIT] Unity instance created successfully.");
                    }).catch((e) => {
                        errLog("Unity instance creation failed.", e);
                        setError("Failed to load the game engine.");
                    });
                };
            } catch (e) {
                errLog("Failed to load initial progress from backend.", e);
                setError("Failed to load your saved progress.");
            }
        };
        
        initializeGame();

        return () => {
            log('Component unmounting. Cleaning up interceptor and timers.');
            console.log = originalConsoleLog;
            clearTimeout(collectionTimer.current);
            if (unityInstance.current) {
                unityInstance.current.Quit();
                unityInstance.current = null;
            }
        };
    }, []);

    return (
        <div className="w-full h-full flex flex-col justify-center items-center p-4 bg-background relative">
            <a href="/dashboard" className="absolute top-4 left-4 z-50 text-white font-light py-2 px-4 rounded-md transition hover:bg-white/10">
                &larr; Back to Dashboard
            </a>
            <div className="relative w-[960px] h-[600px] bg-black rounded-lg shadow-2xl">
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col justify-center items-center text-white">
                        <Loader2 className="animate-spin h-12 w-12 mb-4" />
                        <p>{loadingMessage}</p>
                        {error && <p className="text-red-500 mt-2">{error}</p>}
                    </div>
                )}
                <canvas 
                    ref={canvasRef} 
                    id="unity-canvas" 
                    style={{ width: '100%', height: '100%', visibility: isLoading ? 'hidden' : 'visible' }}
                ></canvas>
            </div>
             {error && !isLoading && (
                <div className="mt-4 text-red-500 text-center">
                    <p>An error occurred: {error}</p>
                    <p>Please try refreshing the page.</p>
                </div>
             )}
        </div>
    );
};

export default DataForgeGame;