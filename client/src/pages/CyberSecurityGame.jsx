import { useEffect } from 'react';
import { api } from '../services/api';
import { logger } from '../services/logger';

const GAME_ID = "cyber-security";
const LOCAL_STORAGE_KEY = 'gameData';

const CyberSecurityGame = () => {
    const context = `CyberSecurityGame`;

    const saveProgressToBackend = async (payload) => {
        logger.info('>>> SAVE PROCESS INITIATED >>>', { context, details: payload });
        try {
            await api(`/users/me/gamedata/${GAME_ID}`, 'POST', payload);
            logger.success('<<< BACKEND SAVE SUCCESSFUL <<<', { context });
        } catch (err) {
            logger.error('!!! BACKEND SAVE FAILED !!!', { context, details: { error: err.message } });
        }
    };

    useEffect(() => {
        logger.startNewTrace();
        logger.info('CyberSecurityGame component mounted.', { context });

        const initializeGameData = async () => {
            try {
                const userGameData = await api(`/users/me/gamedata/${GAME_ID}`);
                logger.info('[INIT] Loaded user progress from backend.', { context, details: userGameData });

                const high_score = [];
                if (userGameData.highScores && userGameData.highScores["1"]) {
                    high_score.push({ stage_id: 1, high_score: userGameData.highScores["1"] });
                }
                
                const initData = JSON.stringify({ data: { stages_completed: [], high_score } });
                window.localStorage.setItem(LOCAL_STORAGE_KEY, initData);
                logger.info('[INIT] Sent initial state to Unity via localStorage.', { context, details: { initData } });
            } catch (e) {
                logger.error("Failed to load initial progress for the game.", { context, details: { error: e.message } });
                window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ data: { stages_completed: [], high_score: [] } }));
            }
        };
        initializeGameData();

        // --- THIS IS THE FIX: Reverted to using postMessage listener ---
        const handleGameMessage = (event) => {
            const message = event.data;
            if (typeof message !== 'string' || !message.startsWith("Unity sent JSON to page:")) {
                return;
            }

            logger.info('Final game data packet received via postMessage.', { context, details: { rawMessage: message } });

            try {
                const jsonString = message.substring(message.indexOf('{'));
                const gameData = JSON.parse(jsonString);
                
                logger.info('Successfully parsed JSON from game.', { context, details: { parsedData: gameData } });

                const extractValue = (data) => {
                    if (Array.isArray(data) && data.length > 0) return data[0];
                    return data;
                };

                const finalPayload = {
                    stage: 1,
                    status: 2, // 2 = completed
                    score: parseInt(extractValue(gameData.high_score)) || 0,
                    badge: parseInt(extractValue(gameData.badges)) || 0,
                    xp: parseInt(extractValue(gameData.xp_earned)) || 0,
                    certificate: true,
                };

                logger.info('Constructed final payload to send to backend.', { context, details: { payload: finalPayload } });
                
                saveProgressToBackend(finalPayload);

            } catch (e) {
                logger.error("Failed to parse or process JSON from postMessage.", { context, details: { error: e.message, rawMessage: message } });
            }
        };

        window.addEventListener("message", handleGameMessage);
        // --- END OF FIX ---

        return () => {
            window.removeEventListener("message", handleGameMessage);
            logger.info('Component unmounted. Cleaned up listener.', { context });
        };
    }, []);

    return (
        <div className="w-full h-full overflow-hidden bg-background">
            <a href="/dashboard" className="absolute top-4 left-4 z-50 text-foreground font-light py-2 px-4 rounded-md transition hover:bg-accent">
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

