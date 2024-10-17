import { useState, useEffect, useRef, useCallback } from 'react';
import { AI_DIFFICULTY } from './constants';
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
    const abortControllerRef = useRef(null);

    const cancelAIMove = useCallback(() => {
        if (aiTimeoutRef.current) {
            clearTimeout(aiTimeoutRef.current);
        }
        if (thinkingIntervalRef.current) {
            clearInterval(thinkingIntervalRef.current);
        }
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setAiThinking(false);
        setThinkingTime(0);
    }, []);

    const aiMove = useCallback(async (handleColumnClick) => {
        cancelAIMove();

        setAiThinking(true);
        setThinkingTime(0);
        thinkingIntervalRef.current = setInterval(() => {
            setThinkingTime(prevTime => prevTime + 1);
        }, 1000);

        const difficulty = currentPlayer === 'red' ? aiDifficultyRed : aiDifficultyYellow;
        const thinkingTime = getThinkingTime(difficulty);

        aiTimeoutRef.current = setTimeout(async () => {
            try {
                abortControllerRef.current = new AbortController();
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
                    signal: abortControllerRef.current.signal,
                });

                const data = await response.json();
                const aiSelectedColumn = data.column;

                if (aiSelectedColumn !== undefined) {
                    handleColumnClick(aiSelectedColumn, true);
                } else {
                    console.error('Invalid AI move received from server');
                    fallbackToRandomMove(board, handleColumnClick);
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('AI move request was cancelled');
                } else {
                    console.error('Error fetching AI move:', error);
                    fallbackToRandomMove(board, handleColumnClick);
                }
            } finally {
                setAiThinking(false);
                clearInterval(thinkingIntervalRef.current);
            }
        }, thinkingTime);
    }, [board, currentPlayer, aiDifficultyRed, aiDifficultyYellow, cancelAIMove]);

    useEffect(() => {
        return cancelAIMove;
    }, [cancelAIMove]);

    return { aiMove, aiThinking, thinkingTime, cancelAIMove };
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

const fallbackToRandomMove = (board, handleColumnClick) => {
    const availableColumns = getAvailableColumns(board);
    const randomColumn = availableColumns[Math.floor(Math.random() * availableColumns.length)];
    handleColumnClick(randomColumn, true);
};