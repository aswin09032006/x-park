import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { logger } from '../services/logger';

const GameContext = createContext();
export const useGames = () => useContext(GameContext);

const GAME_LEVEL_COUNTS = {
    'cyber-security': 1,
    'data-forge': 5,
};

export const GameProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [savedGames, setSavedGames] = useState([]);
    const [playedGames, setPlayedGames] = useState([]);
    const [userGameData, setUserGameData] = useState({});
    const context = 'GameContext';

    const fetchSavedGames = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const gamesData = await api('/users/me/saved-games');
            setSavedGames(gamesData);
        } catch (error) {
            logger.error("Failed to fetch saved games.", { context, details: { error: error.message } });
        }
    }, [isAuthenticated]);

    const fetchPlayedGames = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const gamesData = await api('/users/me/played-games');
            setPlayedGames(gamesData);
        } catch (error) {
            logger.error("Failed to fetch played games.", { context, details: { error: error.message } });
        }
    }, [isAuthenticated]);

    const fetchUserProgress = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const progressData = await api('/users/me/gamedata');
            setUserGameData(progressData);
        } catch (error) {
            logger.error("Failed to fetch user game progress.", { context, details: { error: error.message } });
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSavedGames();
            fetchPlayedGames();
            fetchUserProgress();
        } else {
            setSavedGames([]);
            setPlayedGames([]);
            setUserGameData({});
        }
    }, [isAuthenticated, fetchSavedGames, fetchPlayedGames, fetchUserProgress]);
    
    const saveGame = async (game) => {
        try {
            setSavedGames((prev) => [...prev, game]);
            await api('/users/me/saved-games', 'POST', { gameId: game._id });
            logger.info('Game saved.', { context, details: { gameId: game._id } });
        } catch (error) {
            logger.error("Failed to save game.", { context, details: { gameId: game._id, error: error.message } });
            setSavedGames((prev) => prev.filter((g) => g._id !== game._id));
        }
    };
    
    const unsaveGame = async (gameId) => {
        const originalState = savedGames;
        try {
            setSavedGames((prev) => prev.filter((game) => game._id !== gameId));
            await api(`/users/me/saved-games/${gameId}`, 'DELETE');
            logger.info('Game unsaved.', { context, details: { gameId } });
        } catch (error) {
            logger.error("Failed to unsave game.", { context, details: { gameId, error: error.message } });
            setSavedGames(originalState);
        }
    };

    const isGameSaved = (gameId) => !!savedGames.find(game => game._id === gameId);

    const getGameProgress = (game) => {
        const gameIdentifier = game.gameUrl?.split('/').pop();
        if (!gameIdentifier || !GAME_LEVEL_COUNTS[gameIdentifier] || !userGameData[gameIdentifier]) return 0;
        const progress = userGameData[gameIdentifier];
        const completedLevels = progress.completedLevels ? Object.keys(progress.completedLevels).length : 0;
        const totalLevels = GAME_LEVEL_COUNTS[gameIdentifier];
        if (totalLevels === 0) return 0;
        return Math.round((completedLevels / totalLevels) * 100);
    };
    
    const isGameInProgress = (game) => {
        const gameIdentifier = game.gameUrl?.split('/').pop();
        if (!gameIdentifier || !userGameData[gameIdentifier]) return false;
        const progress = userGameData[gameIdentifier];
        const completedLevels = progress.completedLevels ? Object.keys(progress.completedLevels).length : 0;
        const totalLevels = GAME_LEVEL_COUNTS[gameIdentifier] || 0;
        return completedLevels > 0 && completedLevels < totalLevels;
    };
    
    const startGame = async (game) => {
        if (!game || !game._id) return;
        if (!playedGames.some(p => p._id === game._id)) {
            try {
                setPlayedGames(prev => [...prev, game]);
                await api('/users/me/played-games', 'POST', { gameId: game._id });
                logger.info('Game started and added to played list.', { context, details: { gameId: game._id } });
            } catch (error) {
                logger.error("Failed to add to played games.", { context, details: { gameId: game._id, error: error.message } });
                setPlayedGames(prev => prev.filter(p => p._id !== game._id));
            }
        }
    };

    const value = { savedGames, playedGames, saveGame, unsaveGame, isGameSaved, startGame, isGameInProgress, getGameProgress, fetchUserProgress };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
};