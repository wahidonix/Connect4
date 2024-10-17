import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MoveLog from './MoveLog';
import MoveNavigation from './MoveNavigation';
import { COLS, ROWS } from './constants';
import { getPlayerName } from './utils';
import './Connect4.css';

const GameBoard = ({
    board,
    currentPlayer,
    winner,
    isDraw,
    winningCells,
    isAnimating,
    isReviewMode,
    isCheatMode,
    winningMove,
    aiThinking,
    thinkingTime,
    moves,
    moveHistory,
    currentMoveIndex,
    windowSize,
    handleColumnClick,
    resetGame,
    setGameMode,
    setIsReviewMode,
    setIsCheatMode,
    setCurrentMoveIndex,
    setBoard,
    gameMode
}) => {
    const isMobile = windowSize.width <= 768;
    const [isMoveLogOpen, setIsMoveLogOpen] = useState(false);
    const cellSize = Math.min(windowSize.width / (COLS + 2), windowSize.height / (ROWS + 4), 80);

    const renderCell = (cell, rowIndex, colIndex) => (
        <motion.div
            key={colIndex}
            className="cell"
            style={{
                width: cellSize,
                height: cellSize,
            }}
            onClick={() => handleColumnClick(colIndex)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <AnimatePresence>
                {cell && (
                    <motion.div
                        key={`${rowIndex}-${colIndex}`}
                        className={`piece ${cell.color}`}
                        style={{
                            width: cellSize * 0.8,
                            height: cellSize * 0.8,
                        }}
                        initial={
                            cell.isNew
                                ? {
                                    y: -windowSize.height,
                                    scale: 0.5,
                                }
                                : { scale: 1 }
                        }
                        animate={{ y: 0, scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={
                            cell.isNew
                                ? {
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 30,
                                }
                                : { duration: 0.2 }
                        }
                    />
                )}
            </AnimatePresence>
            {winningCells.some(
                ([r, c]) => r === rowIndex && c === colIndex
            ) && (
                <motion.div
                    className="winning-piece"
                    style={{
                        width: cellSize * 0.8,
                        height: cellSize * 0.8,
                    }}
                    initial={{ scale: 0 }}
                    animate={{
                        scale: [0, 1.2, 1],
                    }}
                    transition={{
                        duration: 0.5,
                        times: [0, 0.6, 1],
                    }}
                />
            )}
        </motion.div>
    );

    return (
        <div className="game-board">
            <h2>
                {winner
                    ? `${getPlayerName(winner, gameMode)} Wins!`
                    : isDraw
                        ? "It's a draw!"
                        : `Current Player: ${getPlayerName(currentPlayer, gameMode)}`}
            </h2>
            <div style={{ height: '50px' }}>
                {aiThinking && (
                    <p className="ai-thinking">AI Thinking...{thinkingTime}s</p>
                )}
            </div>
            <div className="game-content">
                {isReviewMode && (
                    <div className="review-mode">
                        <h3>Review Mode</h3>
                        <MoveNavigation
                            currentMoveIndex={currentMoveIndex}
                            moveHistory={moveHistory}
                            setCurrentMoveIndex={setCurrentMoveIndex}
                            setBoard={setBoard}
                        />
                        <button onClick={() => {
                            setIsReviewMode(false);
                            setCurrentMoveIndex(moveHistory.length - 1);
                            setBoard(moveHistory[moveHistory.length - 1]);
                        }}>
                            Exit Review Mode
                        </button>
                    </div>
                )}
                <div className="game-area">
                    <div
                        className="board"
                        style={{
                            padding: cellSize / 2,
                            maxWidth: cellSize * COLS + cellSize,
                            maxHeight: cellSize * ROWS + cellSize,
                        }}
                    >
                        {board.map((row, rowIndex) => (
                            <div key={rowIndex} className="row">
                                {row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))}
                            </div>
                        ))}
                    </div>
                    <div className="controls">
                        <button onClick={resetGame}>Reset Game</button>
                        <button onClick={() => {
                            resetGame();
                            setGameMode('menu');
                        }}>
                            Main Menu
                        </button>
                        {(winner || isDraw) && (
                            <button onClick={() => setIsReviewMode(true)}>
                                Review Game
                            </button>
                        )}
                        <button onClick={() => setIsCheatMode(!isCheatMode)}>
                            {isCheatMode ? 'Disable Cheat' : 'Enable Cheat'}
                        </button>
                    </div>
                    {isCheatMode && (
                        <div className="cheat-info">
                            {winningMove !== null ? (
                                <p>Winning move available in column {winningMove + 1}</p>
                            ) : (
                                <p>No winning move available</p>
                            )}
                        </div>
                    )}
                </div>
                {!isMobile && <MoveLog moves={moves} gameMode={gameMode} />}
            </div>
            {isMobile && (
                <>
                    <button onClick={() => setIsMoveLogOpen(true)}>Show Move Log</button>
                    {isMoveLogOpen && (
                        <div
                            className="modal-overlay"
                            onClick={() => setIsMoveLogOpen(false)}
                        >
                            <div
                                className="modal-content"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoveLog moves={moves} gameMode={gameMode} />
                                <button onClick={() => setIsMoveLogOpen(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default GameBoard;