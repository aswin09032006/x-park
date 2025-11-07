import { Loader2, Maximize2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { logger } from '../services/logger';

const GAME_ID = "DataForge";
const UNITY_BUILD_DIR = `/${GAME_ID}/Build`;
const NUM_LEVELS = 5;
const LOCAL_STORAGE_KEY = 'gameData';

const getStatusString = (level, completedLevels) => (completedLevels && completedLevels[String(level)]) ? "completed" : "locked";

const DataForgeGame = () => {
    const unityInstance = useRef(null);
    const canvasRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('Initializing...');
    const progressDataCollector = useRef({});
    const collectionTimer = useRef(null);
    const saveState = useRef('IDLE');
    const context = 'DataForgeGame';

    const saveProgressToBackend = async (finalPayload) => {
        logger.info('>>> SAVE PROCESS INITIATED >>>', { context, details: finalPayload });
        try {
            await api(`/users/me/gamedata/data-forge`, 'POST', finalPayload);
            logger.success('<<< BACKEND SAVE SUCCESSFUL <<<', { context });
        } catch (err) {
            logger.error('!!! BACKEND SAVE FAILED !!!', { context, details: { error: err.message } });
            setError("A network error occurred while saving your progress.");
        }
    };

    useEffect(() => {
        logger.startNewTrace();
        logger.info('Component mounted. Initializing console interceptor.', { context });

        const processAndSaveData = () => {
            const collectedData = progressDataCollector.current;
            const lastCompletedStage = collectedData.stages_completed?.filter(s => s.status === "completed").pop();
            if (!lastCompletedStage) {
                logger.warn('!!! SAVE FAILED !!! No "completed" stage found in collected data.', { context, details: collectedData });
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
        };

        const originalConsoleLog = console.log;
        console.log = (...args) => {
            originalConsoleLog(...args);
            const logString = args.join(' ');
            if (logString.includes("New Checkpoint: EndGame")) saveState.current = 'ARMED';
            else if (logString.startsWith("Unity sent JSON to page:")) {
                if (saveState.current === 'IDLE') return;
                try {
                    const packet = JSON.parse(logString.substring(logString.indexOf('{')));
                    if (packet.data) {
                        if (saveState.current === 'ARMED') saveState.current = 'COLLECTING';
                        Object.assign(progressDataCollector.current, packet.data);
                        clearTimeout(collectionTimer.current);
                        collectionTimer.current = setTimeout(processAndSaveData, 300);
                    }
                } catch (e) {
                    logger.error("Failed to parse JSON packet from game.", { context, details: { error: e.message, rawLog: logString } });
                }
            }
        };

        const initializeGame = async () => {
            try {
                const userGameData = await api('/users/me/gamedata/data-forge');
                const stages_completed = Array.from({ length: NUM_LEVELS }, (_, i) => ({ stage_id: i + 1, status: getStatusString(i + 1, userGameData.completedLevels) }));
                const high_score = userGameData.highScores ? Object.entries(userGameData.highScores).map(([stageId, score]) => ({ stage_id: parseInt(stageId), high_score: score })) : [];
                const initData = JSON.stringify({ data: { stages_completed, high_score } });
                window.localStorage.setItem(LOCAL_STORAGE_KEY, initData);

                const script = document.createElement("script");
                script.src = `${UNITY_BUILD_DIR}/DataForge55_improvement.loader.js`;
                script.onload = () => {
                    window.createUnityInstance(canvasRef.current, { dataUrl: `${UNITY_BUILD_DIR}/DataForge55_improvement.data.br`, frameworkUrl: `${UNITY_BUILD_DIR}/DataForge55_improvement.framework.js.br`, codeUrl: `${UNITY_BUILD_DIR}/DataForge55_improvement.wasm.br` }, (p) => setLoadingMessage(`Loading Game... ${Math.round(p * 100)}%`))
                    .then((instance) => {
                        unityInstance.current = instance;
                        setIsLoading(false);
                        logger.success("[INIT] Unity instance created successfully.", { context });
                    }).catch((e) => {
                        logger.error("Unity instance creation failed.", { context, details: { error: e.message } });
                        setError("Failed to load the game engine.");
                    });
                };
                document.body.appendChild(script);
            } catch (e) {
                logger.error("Failed to load initial progress from backend.", { context, details: { error: e.message } });
                setError("Failed to load your saved progress.");
            }
        };
        initializeGame();

        return () => {
            console.log = originalConsoleLog;
            clearTimeout(collectionTimer.current);
            if (unityInstance.current) {
                unityInstance.current.Quit();
                unityInstance.current = null;
            }
            logger.info('Component unmounted. Cleaned up.', { context });
        };
    }, []);

    const handleFullscreen = () => {
        if (!document.fullscreenElement) canvasRef.current?.requestFullscreen().catch(err => logger.warn('Fullscreen request failed.', { context, details: { error: err.message } }));
        else document.exitFullscreen();
    };

    return (
        <div className="w-full h-full flex flex-col justify-center items-center p-4 bg-background relative">
            <a href="/dashboard" className="absolute top-4 left-4 z-50 text-foreground font-light py-2 px-4 rounded-md transition hover:bg-accent">
                &larr; Back to Dashboard
            </a>
            <div className="relative w-[960px] h-[600px] bg-black rounded-lg shadow-2xl">
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col justify-center items-center text-foreground">
                        <Loader2 className="animate-spin h-12 w-12 mb-4" />
                        <p>{loadingMessage}</p>
                        {error && <p className="text-destructive mt-2">{error}</p>}
                    </div>
                )}
                <canvas ref={canvasRef} id="unity-canvas" style={{ width: '100%', height: '100%', visibility: isLoading ? 'hidden' : 'visible' }}></canvas>
            </div>
            {!isLoading && (
                <div className="w-[960px] flex justify-end mt-3">
                    <button onClick={handleFullscreen} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-2 py-2 transition text-sm">
                        <Maximize2 size={16} />
                    </button>
                </div>
            )}
            {error && !isLoading && (
                <div className="mt-4 text-destructive text-center">
                    <p>An error occurred: {error}</p>
                    <p>Please try refreshing the page.</p>
                </div>
            )}
        </div>
    );
};

export default DataForgeGame;