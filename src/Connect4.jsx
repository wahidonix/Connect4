import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Connect4.css';

const ROWS = 6;
const COLS = 7;

const Connect4 = () => {
    const [board, setBoard] = useState(Array(ROWS).fill().map(() => Array(COLS).fill(null)));
    const [currentPlayer, setCurrentPlayer] = useState('red');
    const [gameMode, setGameMode] = useState('menu');
    const [winner, setWinner] = useState(null);
    const [winningCells, setWinningCells] = useState([]);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reset game state when returning to the main menu
    useEffect(() => {
        if (gameMode === 'menu') {
            resetGame();
        }
    }, [gameMode]);

    const cellSize = Math.min(windowSize.width / (COLS + 2), windowSize.height / (ROWS + 4));

    const resetGame = () => {
        setBoard(Array(ROWS).fill().map(() => Array(COLS).fill(null)));
        setCurrentPlayer('red');
        setWinner(null);
        setWinningCells([]);
        setIsAnimating(false);
    };

    const checkWinner = (row, col) => {
        const directions = [
            [0, 1],  // horizontal
            [1, 0],  // vertical
            [1, 1],  // diagonal \
            [1, -1]  // diagonal /
        ];

        for (const [dx, dy] of directions) {
            let count = 1;
            let cells = [[row, col]];

            // Check in positive direction
            for (let i = 1; i < 4; i++) {
                const newRow = row + i * dx;
                const newCol = col + i * dy;
                if (
                    newRow >= 0 && newRow < ROWS &&
                    newCol >= 0 && newCol < COLS &&
                    board[newRow][newCol]?.color === currentPlayer
                ) {
                    count++;
                    cells.push([newRow, newCol]);
                } else {
                    break;
                }
            }

            // Check in negative direction
            for (let i = 1; i < 4; i++) {
                const newRow = row - i * dx;
                const newCol = col - i * dy;
                if (
                    newRow >= 0 && newRow < ROWS &&
                    newCol >= 0 && newCol < COLS &&
                    board[newRow][newCol]?.color === currentPlayer
                ) {
                    count++;
                    cells.push([newRow, newCol]);
                } else {
                    break;
                }
            }

            if (count >= 4) {
                setWinningCells(cells);
                return true;
            }
        }
        return false;
    };

    const handleColumnClick = (col, isAiMove = false) => {
        if (winner || isAnimating) return;
        if ((gameMode === 'pve' && currentPlayer === 'yellow' && !isAiMove) || (gameMode === 'eve' && !isAiMove)) return;

        for (let row = ROWS - 1; row >= 0; row--) {
            if (!board[row][col]) {
                setIsAnimating(true);
                const newBoard = board.map((row) => [...row]);
                newBoard[row][col] = { color: currentPlayer, isNew: true };
                setBoard(newBoard);

                if (checkWinner(row, col)) {
                    setWinner(currentPlayer);
                }

                // Remove the 'isNew' flag and update currentPlayer after animation
                setTimeout(() => {
                    const updatedBoard = board.map((row) => [...row]);
                    updatedBoard[row][col] = { color: currentPlayer, isNew: false };
                    setBoard(updatedBoard);
                    setIsAnimating(false);

                    if (!winner) {
                        setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red');
                    }
                }, 500);

                break;
            }
        }
    };

    const aiMove = () => {
        const validColumns = [];
        for (let col = 0; col < COLS; col++) {
            if (!board[0][col]) {
                validColumns.push(col);
            }
        }
        if (validColumns.length === 0) return; // Board is full
        const randomCol = validColumns[Math.floor(Math.random() * validColumns.length)];
        // Adding a slight delay to mimic thinking
        setTimeout(() => {
            handleColumnClick(randomCol, true);
        }, 500);
    };

    useEffect(() => {
        if (!isAnimating && !winner) {
            if (gameMode === 'pve' && currentPlayer === 'yellow') {
                aiMove();
            } else if (gameMode === 'eve') {
                aiMove();
            }
        }
    }, [currentPlayer, isAnimating, winner, gameMode]);

    const MainMenu = () => (
        <div className="main-menu">
            <h1>Connect 4</h1>
            <button onClick={() => setGameMode('pvp')}>
                Player vs Player
            </button>
            <button onClick={() => setGameMode('pve')}>
                Player vs AI
            </button>
            <button onClick={() => setGameMode('eve')}>
                AI vs AI
            </button>
        </div>
    );

    const getPlayerName = (color) => {
        if (gameMode === 'pve') {
            return color === 'red' ? 'Red Player' : 'AI';
        } else if (gameMode === 'eve') {
            return color === 'red' ? 'AI (Red)' : 'AI (Yellow)';
        } else {
            return `${color.charAt(0).toUpperCase() + color.slice(1)} Player`;
        }
    };

    const GameBoard = () => (
        <div className="game-board">
            <h2>
                {winner
                    ? `${getPlayerName(winner)} Wins!`
                    : `Current Player: ${getPlayerName(currentPlayer)}`}
            </h2>
            <div className="board" style={{ padding: cellSize / 2 }}>
                {board.map((row, rowIndex) => (
                    <div key={rowIndex} className="row">
                        {row.map((cell, colIndex) => (
                            <motion.div
                                key={colIndex}
                                className="cell"
                                style={{ width: cellSize, height: cellSize }}
                                onClick={() => handleColumnClick(colIndex)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <AnimatePresence>
                                    {cell && (
                                        <motion.div
                                            key={`${rowIndex}-${colIndex}`}
                                            className={`piece ${cell.color}`}
                                            style={{ width: cellSize * 0.8, height: cellSize * 0.8 }}
                                            initial={cell.isNew ? { y: -windowSize.height, scale: 0.5 } : { scale: 1 }}
                                            animate={{ y: 0, scale: 1 }}
                                            exit={{ scale: 0 }}
                                            transition={cell.isNew ? { type: 'spring', stiffness: 300, damping: 30 } : { duration: 0.2 }}
                                        />
                                    )}
                                </AnimatePresence>
                                {winningCells.some(([r, c]) => r === rowIndex && c === colIndex) && (
                                    <motion.div
                                        className="winning-piece"
                                        style={{ width: cellSize * 0.8, height: cellSize * 0.8 }}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: [0, 1.2, 1] }}
                                        transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                                    />
                                )}
                            </motion.div>
                        ))}
                    </div>
                ))}
            </div>
            <div className="controls">
                <button onClick={resetGame}>
                    Reset Game
                </button>
                <button onClick={() => setGameMode('menu')}>
                    Main Menu
                </button>
            </div>
        </div>
    );

    return (
        <div className="connect4">
            {gameMode === 'menu' && <MainMenu />}
            {(gameMode === 'pvp' || gameMode === 'pve' || gameMode === 'eve') && <GameBoard />}
        </div>
    );
};

export default Connect4;
