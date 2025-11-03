import React, { useEffect } from 'react';
import { useGames } from '../context/GameContext';
import { api } from '../services/api';

const GAME_ID = "cyber-security";
const LOCAL_STORAGE_KEY = 'gameData'; // The key the game reads from localStorage

const CyberSecurityGame = () => {
    const { stopGame } = useGames();

    const log = (message, ...args) => console.log(`%c[React Parent] ${message}`, 'color: #00dd00; font-weight: bold;', ...args);
    const errLog = (message, ...args) => console.error(`%c[React Parent ERROR] ${message}`, 'color: #ff0000; font-weight: bold;', ...args);
    const interceptLog = (message, ...args) => console.log(`%c[Message Listener] ${message}`, 'color: #0000ff; font-weight: bold;', ...args);

    const saveProgressToBackend = async (payload) => {
        log('>>> SAVE PROCESS INITIATED >>>', payload);
        try {
            await api(`/users/me/gamedata/${GAME_ID}`, 'POST', payload);
            log('<<< BACKEND SAVE SUCCESSFUL <<<');
        } catch (err) {
            errLog('!!! BACKEND SAVE FAILED !!! API call returned an error.', err);
        }
    };

    useEffect(() => {
        // --- 1. PLATFORM -> GAME: Send existing data to the game on load ---
        const initializeGameData = async () => {
            try {
                const userGameData = await api(`/users/me/gamedata/${GAME_ID}`);
                log('[INIT] Loaded user progress from backend:', userGameData);

                const high_score = [];
                const isNewPlayer = !userGameData.highScores || Object.keys(userGameData.highScores).length === 0;

                if (isNewPlayer) {
                    log("[INIT] New player. Sending empty high_score to game.");
                } else {
                    log('[INIT] Returning player. Sending existing high_score to game.');
                    if (userGameData.highScores["1"]) {
                         high_score.push({ stage_id: 1, high_score: userGameData.highScores["1"] });
                    }
                }
                
                // The game inside the iframe will read this from localStorage on startup.
                // It expects an empty `stages_completed` array, so we provide it.
                const initData = JSON.stringify({ data: { stages_completed: [], high_score } });
                log('[INIT] Sending initial state to Unity via localStorage:', initData);
                window.localStorage.setItem(LOCAL_STORAGE_KEY, initData);

            } catch (e) {
                errLog("Failed to load initial progress for the game.", e);
                window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ data: { stages_completed: [], high_score: [] } }));
            }
        };

        initializeGameData();

        // --- 2. GAME -> PLATFORM: Listen for the final data from the game ---
        const handleGameMessage = (event) => {
            const message = event.data;
            if (typeof message !== 'string' || !message.startsWith("Unity sent JSON to page:")) {
                return;
            }

            interceptLog('Final game data packet received via postMessage.');

            try {
                const jsonString = message.substring(message.indexOf('{'));
                const gameData = JSON.parse(jsonString);

                const finalScore = gameData.high_score?.[0] || 0;
                const finalBadge = gameData.badges?.[0] || 0;
                const finalXp = gameData.xp_earned?.[0] || 0;

                const finalPayload = {
                    stage: 1,
                    status: 2,
                    score: parseInt(finalScore) || 0,
                    badge: parseInt(finalBadge) || 0,
                    xp: parseInt(finalXp) || 0,
                    certificate: 1 // Award certificate on game completion
                };
                
                saveProgressToBackend(finalPayload);

            } catch (e) {
                errLog("Failed to parse or process JSON from postMessage.", e);
            }
        };

        window.addEventListener("message", handleGameMessage);

        // --- 3. CLEANUP ---
        return () => {
            window.removeEventListener("message", handleGameMessage);
            stopGame('1');
            log('Component unmounted. Cleaned up listener and timer.');
        };
    }, [stopGame]);

    return (
        <div className="w-full h-full overflow-hidden bg-background">
            <a 
                href="/dashboard" 
                className="absolute top-4 left-4 z-50 text-white font-light py-2 px-4 rounded-md transition"
            >
                &larr; Back to Dashboard
            </a>
            <iframe
                src="/cyber-security/index.html"
                title="Cybersecurity Game"
                style={{ border: 'none', width: '100%', height: '100%' }}
                allow="fullscreen"
            ></iframe>
        </div>
    );
};

export default CyberSecurityGame;
