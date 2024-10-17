import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainMenu from './MainMenu';
import GameBoard from './GameBoard';
import { ROWS, COLS } from './constants';
import { checkWinner, checkDraw, checkForWinningMove } from './utils';
import { useWindowSize, useAIMove } from './hooks';
import './Connect4.css';

const Connect4 = () => {
    const [board, setBoard] = useState(Array(ROWS).fill().map(() => Array(COLS).fill(null)));
    const [currentPlayer, setCurrentPlayer] = useState('red');
    const [gameMode, setGameMode] = useState('menu');
    const [winner, setWinner] = useState(null);
    const [isDraw, setIsDraw] = useState(false);
    const [winningCells, setWinningCells] = useState([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [selectedGameMode, setSelectedGameMode] = useState('pvp');
    const [moves, setMoves] = useState([]);
    const [aiDifficultyRed, setAiDifficultyRed] = useState('easy');
    const [aiDifficultyYellow, setAiDifficultyYellow] = useState('easy');
    const [moveHistory, setMoveHistory] = useState([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [isCheatMode, setIsCheatMode] = useState(false);
    const [winningMove, setWinningMove] = useState(null);

    const windowSize = useWindowSize();
    const { aiMove, aiThinking, thinkingTime, cancelAIMove } = useAIMove(board, currentPlayer, gameMode, aiDifficultyRed, aiDifficultyYellow);

    const resetGame = () => {
        cancelAIMove();
        setBoard(Array(ROWS).fill().map(() => Array(COLS).fill(null)));
        setCurrentPlayer('red');
        setWinner(null);
        setIsDraw(false);
        setWinningCells([]);
        setIsAnimating(false);
        setMoves([]);
        setMoveHistory([]);
        setCurrentMoveIndex(-1);
        setIsReviewMode(false);
        setWinningMove(null);
    };

    const handleColumnClick = (col, isAiMove = false) => {
        if (winner || isAnimating || isDraw || isReviewMode) return;
        if (
            (gameMode === 'pve' && currentPlayer === 'yellow' && !isAiMove) ||
            (gameMode === 'eve' && !isAiMove)
        )
            return;

        for (let row = ROWS - 1; row >= 0; row--) {
            if (!board[row][col]) {
                setIsAnimating(true);
                const newBoard = board.map((row) => [...row]);
                newBoard[row][col] = { color: currentPlayer, isNew: true };
                setBoard(newBoard);

                const newMove = {
                    player: currentPlayer,
                    row,
                    col,
                    moveNumber: moves.length + 1,
                    isAiMove,
                };
                setMoves((prevMoves) => [...prevMoves, newMove]);

                setMoveHistory((prevHistory) => [...prevHistory, newBoard]);
                setCurrentMoveIndex((prevIndex) => prevIndex + 1);

                const winningCells = checkWinner(row, col, newBoard);
                if (winningCells) {
                    setWinner(currentPlayer);
                    setWinningCells(winningCells);
                } else if (checkDraw(newBoard)) {
                    setIsDraw(true);
                } else {
                    setWinningCells([]);
                }

                setTimeout(() => {
                    const updatedBoard = board.map((row) => [...row]);
                    updatedBoard[row][col] = {
                        color: currentPlayer,
                        isNew: false,
                    };
                    setBoard(updatedBoard);
                    setIsAnimating(false);

                    if (!winner && !isDraw) {
                        setCurrentPlayer(
                            currentPlayer === 'red' ? 'yellow' : 'red'
                        );
                    }
                }, 500);

                break;
            }
        }
    };

    useEffect(() => {
        if (!isAnimating && !winner && !isDraw && !isReviewMode) {
            if (
                (gameMode === 'pve' && currentPlayer === 'yellow') ||
                gameMode === 'eve'
            ) {
                aiMove(handleColumnClick);
            }
        }
    }, [currentPlayer, isAnimating, winner, isDraw, gameMode, isReviewMode, aiMove]);

    useEffect(() => {
        if (isCheatMode && !winner && !isDraw) {
            const winningCol = checkForWinningMove(board, currentPlayer);
            setWinningMove(winningCol);
        } else {
            setWinningMove(null);
        }
    }, [board, currentPlayer, isCheatMode, winner, isDraw]);

    return (
        <div className="connect4">
            {gameMode === 'menu' && (
                <MainMenu
                    selectedGameMode={selectedGameMode}
                    setSelectedGameMode={setSelectedGameMode}
                    aiDifficultyRed={aiDifficultyRed}
                    setAiDifficultyRed={setAiDifficultyRed}
                    aiDifficultyYellow={aiDifficultyYellow}
                    setAiDifficultyYellow={setAiDifficultyYellow}
                    startGame={() => {
                        resetGame();
                        setGameMode(selectedGameMode);
                    }}
                />
            )}
            {(gameMode === 'pvp' || gameMode === 'pve' || gameMode === 'eve') && (
                <GameBoard
                    board={board}
                    currentPlayer={currentPlayer}
                    winner={winner}
                    isDraw={isDraw}
                    winningCells={winningCells}
                    isAnimating={isAnimating}
                    isReviewMode={isReviewMode}
                    isCheatMode={isCheatMode}
                    winningMove={winningMove}
                    aiThinking={aiThinking}
                    thinkingTime={thinkingTime}
                    moves={moves}
                    moveHistory={moveHistory}
                    currentMoveIndex={currentMoveIndex}
                    windowSize={windowSize}
                    handleColumnClick={handleColumnClick}
                    resetGame={resetGame}
                    setGameMode={setGameMode}
                    setIsReviewMode={setIsReviewMode}
                    setIsCheatMode={setIsCheatMode}
                    setCurrentMoveIndex={setCurrentMoveIndex}
                    setBoard={setBoard}
                    gameMode={gameMode}
                />
            )}
        </div>
    );
};

export default Connect4;