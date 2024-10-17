import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Connect4.css';

const ROWS = 6;
const COLS = 7;

const Connect4 = () => {
    const [board, setBoard] = useState(
        Array(ROWS)
            .fill()
            .map(() => Array(COLS).fill(null))
    );
    const [currentPlayer, setCurrentPlayer] = useState('red');
    const [gameMode, setGameMode] = useState('menu');
    const [winner, setWinner] = useState(null);
    const [winningCells, setWinningCells] = useState([]);
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const [isAnimating, setIsAnimating] = useState(false);
    const [selectedGameMode, setSelectedGameMode] = useState('pvp');

    // Separate AI difficulties for red and yellow AIs
    const [aiDifficultyRed, setAiDifficultyRed] = useState('easy');
    const [aiDifficultyYellow, setAiDifficultyYellow] = useState('easy');

    // Ref to store the AI timeout ID
    const aiTimeoutRef = useRef(null);

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

    // Adjust cellSize to ensure it's responsive on mobile devices
    const cellSize = Math.min(
        windowSize.width / (COLS + 2),
        windowSize.height / (ROWS + 4),
        80 // Maximum cell size for mobile friendliness
    );

    const resetGame = () => {
        setBoard(
            Array(ROWS)
                .fill()
                .map(() => Array(COLS).fill(null))
        );
        setCurrentPlayer('red');
        setWinner(null);
        setWinningCells([]);
        setIsAnimating(false);

        // Clear any pending AI moves
        if (aiTimeoutRef.current) {
            clearTimeout(aiTimeoutRef.current);
            aiTimeoutRef.current = null;
        }
    };

    const checkWinner = (row, col) => {
        const directions = [
            [0, 1], // horizontal
            [1, 0], // vertical
            [1, 1], // diagonal \
            [1, -1], // diagonal /
        ];

        for (const [dx, dy] of directions) {
            let count = 1;
            let cells = [[row, col]];

            // Check in positive direction
            for (let i = 1; i < 4; i++) {
                const newRow = row + i * dx;
                const newCol = col + i * dy;
                if (
                    newRow >= 0 &&
                    newRow < ROWS &&
                    newCol >= 0 &&
                    newCol < COLS &&
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
                    newRow >= 0 &&
                    newRow < ROWS &&
                    newCol >= 0 &&
                    newCol < COLS &&
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

                if (checkWinner(row, col)) {
                    setWinner(currentPlayer);
                }

                // Remove the 'isNew' flag and update currentPlayer after animation
                setTimeout(() => {
                    const updatedBoard = board.map((row) => [...row]);
                    updatedBoard[row][col] = {
                        color: currentPlayer,
                        isNew: false,
                    };
                    setBoard(updatedBoard);
                    setIsAnimating(false);

                    if (!winner) {
                        setCurrentPlayer(
                            currentPlayer === 'red' ? 'yellow' : 'red'
                        );
                    }
                }, 500);

                break;
            }
        }
    };

    const aiMove = () => {
        aiTimeoutRef.current = setTimeout(async () => {
            try {
                // Determine the AI difficulty based on the current player and game mode
                let aiDifficulty;
                if (gameMode === 'pve') {
                    aiDifficulty = aiDifficultyYellow; // AI is yellow
                } else if (gameMode === 'eve') {
                    aiDifficulty =
                        currentPlayer === 'red'
                            ? aiDifficultyRed
                            : aiDifficultyYellow;
                } else {
                    aiDifficulty = 'easy'; // Default difficulty
                }

                const response = await fetch(
                    'http://localhost:5000/ai-move',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            board,
                            aiDifficulty,
                            aiColor: currentPlayer,
                        }),
                    }
                );
                const data = await response.json();
                const aiSelectedColumn = data.column;
                if (aiSelectedColumn !== undefined) {
                    handleColumnClick(aiSelectedColumn, true);
                } else {
                    console.error('Invalid AI move received from server');
                }
            } catch (error) {
                console.error('Error fetching AI move:', error);
            }
        }, 500); // Delay of 500ms to mimic thinking
    };

    useEffect(() => {
        if (!isAnimating && !winner) {
            const performAIMove = async () => {
                if (
                    (gameMode === 'pve' && currentPlayer === 'yellow') ||
                    gameMode === 'eve'
                ) {
                    aiMove();
                }
            };
            performAIMove();
        }
        // Cleanup AI timeout when unmounting or changing game modes
        return () => {
            if (aiTimeoutRef.current) {
                clearTimeout(aiTimeoutRef.current);
                aiTimeoutRef.current = null;
            }
        };
    }, [currentPlayer, isAnimating, winner, gameMode]);

    const MainMenu = () => (
        <div className="main-menu">
            <h1>Connect 4</h1>
            <div className="game-mode-selection">
                <h2>Select Game Mode:</h2>
                <label>
                    <input
                        type="radio"
                        value="pvp"
                        checked={selectedGameMode === 'pvp'}
                        onChange={() => setSelectedGameMode('pvp')}
                    />
                    Player vs Player
                </label>
                <label>
                    <input
                        type="radio"
                        value="pve"
                        checked={selectedGameMode === 'pve'}
                        onChange={() => setSelectedGameMode('pve')}
                    />
                    Player vs AI
                </label>
                <label>
                    <input
                        type="radio"
                        value="eve"
                        checked={selectedGameMode === 'eve'}
                        onChange={() => setSelectedGameMode('eve')}
                    />
                    AI vs AI
                </label>
            </div>

            {selectedGameMode === 'pve' && (
                <div className="ai-difficulty-selection">
                    <h2>Select AI Difficulty:</h2>
                    <label>
                        <input
                            type="radio"
                            value="easy"
                            checked={aiDifficultyYellow === 'easy'}
                            onChange={() => setAiDifficultyYellow('easy')}
                        />
                        Easy
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="medium"
                            checked={aiDifficultyYellow === 'medium'}
                            onChange={() => setAiDifficultyYellow('medium')}
                        />
                        Medium
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="hard"
                            checked={aiDifficultyYellow === 'hard'}
                            onChange={() => setAiDifficultyYellow('hard')}
                        />
                        Hard
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="expert"
                            checked={aiDifficultyYellow === 'expert'}
                            onChange={() => setAiDifficultyYellow('expert')}
                        />
                        Expert
                    </label>
                </div>
            )}

            {selectedGameMode === 'eve' && (
                <div className="ai-difficulty-selection">
                    <h2>Select Red AI Difficulty:</h2>
                    <label>
                        <input
                            type="radio"
                            name="aiDifficultyRed"
                            value="easy"
                            checked={aiDifficultyRed === 'easy'}
                            onChange={() => setAiDifficultyRed('easy')}
                        />
                        Easy
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="aiDifficultyRed"
                            value="medium"
                            checked={aiDifficultyRed === 'medium'}
                            onChange={() => setAiDifficultyRed('medium')}
                        />
                        Medium
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="aiDifficultyRed"
                            value="hard"
                            checked={aiDifficultyRed === 'hard'}
                            onChange={() => setAiDifficultyRed('hard')}
                        />
                        Hard
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="aiDifficultyRed"
                            value="expert"
                            checked={aiDifficultyRed === 'expert'}
                            onChange={() => setAiDifficultyRed('expert')}
                        />
                        Expert
                    </label>

                    <h2>Select Yellow AI Difficulty:</h2>
                    <label>
                        <input
                            type="radio"
                            name="aiDifficultyYellow"
                            value="easy"
                            checked={aiDifficultyYellow === 'easy'}
                            onChange={() => setAiDifficultyYellow('easy')}
                        />
                        Easy
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="aiDifficultyYellow"
                            value="medium"
                            checked={aiDifficultyYellow === 'medium'}
                            onChange={() => setAiDifficultyYellow('medium')}
                        />
                        Medium
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="aiDifficultyYellow"
                            value="hard"
                            checked={aiDifficultyYellow === 'hard'}
                            onChange={() => setAiDifficultyYellow('hard')}
                        />
                        Hard
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="aiDifficultyYellow"
                            value="expert"
                            checked={aiDifficultyYellow === 'expert'}
                            onChange={() => setAiDifficultyYellow('expert')}
                        />
                        Expert
                    </label>
                </div>
            )}

            <button
                onClick={() => {
                    resetGame();
                    setGameMode(selectedGameMode);
                }}
            >
                Start Game
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
                        {row.map((cell, colIndex) => (
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
                                    ([r, c]) =>
                                        r === rowIndex && c === colIndex
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
                        ))}
                    </div>
                ))}
            </div>
            <div className="controls">
                <button onClick={resetGame}>Reset Game</button>
                <button
                    onClick={() => {
                        resetGame();
                        setGameMode('menu');
                    }}
                >
                    Main Menu
                </button>
            </div>
        </div>
    );

    return (
        <div className="connect4">
            {gameMode === 'menu' && <MainMenu />}
            {(gameMode === 'pvp' ||
                gameMode === 'pve' ||
                gameMode === 'eve') && <GameBoard />}
        </div>
    );
};

export default Connect4;
