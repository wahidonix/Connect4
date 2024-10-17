import { useState, useEffect, useRef, useCallback } from 'react';
import { GAME_MODES, AI_DIFFICULTY } from './constants';
import { getAvailableColumns } from './utils';

export const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
};

export const useAIMove = (board, currentPlayer, gameMode, aiDifficultyRed, aiDifficultyYellow) => {
    const [aiThinking, setAiThinking] = useState(false);
    const [thinkingTime, setThinkingTime] = useState(0);
    const thinkingIntervalRef = useRef(null);
    const aiTimeoutRef = useRef(null);

    const aiMove = useCallback(async (handleColumnClick) => {
        setAiThinking(true);
        setThinkingTime(0);
        thinkingIntervalRef.current = setInterval(() => {
            setThinkingTime(prevTime => prevTime + 1);
        }, 1000);

        const difficulty = currentPlayer === 'red' ? aiDifficultyRed : aiDifficultyYellow;
        const thinkingTime = getThinkingTime(difficulty);

        aiTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch('https://connect4-api.vahidr.com/ai-move', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        board,
                        aiDifficulty: difficulty,
                        aiColor: currentPlayer,
                    }),
                });
                const data = await response.json();
                const aiSelectedColumn = data.column;

                if (aiSelectedColumn !== undefined) {
                    handleColumnClick(aiSelectedColumn, true);
                } else {
                    console.error('Invalid AI move received from server');
                    // Fallback to random move if API fails
                    const availableColumns = getAvailableColumns(board);
                    const randomColumn = availableColumns[Math.floor(Math.random() * availableColumns.length)];
                    handleColumnClick(randomColumn, true);
                }
            } catch (error) {
                console.error('Error fetching AI move:', error);
                // Fallback to random move if API fails
                const availableColumns = getAvailableColumns(board);
                const randomColumn = availableColumns[Math.floor(Math.random() * availableColumns.length)];
                handleColumnClick(randomColumn, true);
            } finally {
                setAiThinking(false);
                clearInterval(thinkingIntervalRef.current);
            }
        }, thinkingTime);
    }, [board, currentPlayer, aiDifficultyRed, aiDifficultyYellow]);

    useEffect(() => {
        return () => {
            if (aiTimeoutRef.current) {
                clearTimeout(aiTimeoutRef.current);
            }
            if (thinkingIntervalRef.current) {
                clearInterval(thinkingIntervalRef.current);
            }
        };
    }, []);

    return { aiMove, aiThinking, thinkingTime };
};

const getThinkingTime = (difficulty) => {
    switch (difficulty) {
        case AI_DIFFICULTY.EASY:
            return 500 + Math.random() * 500;
        case AI_DIFFICULTY.MEDIUM:
            return 1000 + Math.random() * 1000;
        case AI_DIFFICULTY.HARD:
            return 1500 + Math.random() * 1500;
        case AI_DIFFICULTY.EXPERT:
            return 2000 + Math.random() * 2000;
        default:
            return 1000;
    }
};