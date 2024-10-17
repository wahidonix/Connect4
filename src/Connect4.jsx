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
    const [isDraw, setIsDraw] = useState(false);
    const [winningCells, setWinningCells] = useState([]);
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const [isAnimating, setIsAnimating] = useState(false);
    const [selectedGameMode, setSelectedGameMode] = useState('pvp');
    const [moves, setMoves] = useState([]);
    const [aiDifficultyRed, setAiDifficultyRed] = useState('easy');
    const [aiDifficultyYellow, setAiDifficultyYellow] = useState('easy');
    const [aiThinking, setAiThinking] = useState(false);
    const [thinkingTime, setThinkingTime] = useState(0);
    const thinkingIntervalRef = useRef(null);
    const aiTimeoutRef = useRef(null);

    const [moveHistory, setMoveHistory] = useState([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
    const [isReviewMode, setIsReviewMode] = useState(false);

    // New state for cheat feature
    const [isCheatMode, setIsCheatMode] = useState(false);
    const [winningMove, setWinningMove] = useState(null);

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

    const cellSize = Math.min(
        windowSize.width / (COLS + 2),
        windowSize.height / (ROWS + 4),
        80
    );

    const resetGame = () => {
        setBoard(
            Array(ROWS)
                .fill()
                .map(() => Array(COLS).fill(null))
        );
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

        if (aiTimeoutRef.current) {
            clearTimeout(aiTimeoutRef.current);
            aiTimeoutRef.current = null;
        }
    };

    const checkWinner = (row, col, currentBoard = board) => {
        const directions = [
            [0, 1],
            [1, 0],
            [1, 1],
            [1, -1],
        ];

        for (const [dx, dy] of directions) {
            let count = 1;
            let cells = [[row, col]];

            for (let i = 1; i < 4; i++) {
                const newRow = row + i * dx;
                const newCol = col + i * dy;
                if (
                    newRow >= 0 &&
                    newRow < ROWS &&
                    newCol >= 0 &&
                    newCol < COLS &&
                    currentBoard[newRow][newCol]?.color === currentBoard[row][col]?.color
                ) {
                    count++;
                    cells.push([newRow, newCol]);
                } else {
                    break;
                }
            }

            for (let i = 1; i < 4; i++) {
                const newRow = row - i * dx;
                const newCol = col - i * dy;
                if (
                    newRow >= 0 &&
                    newRow < ROWS &&
                    newCol >= 0 &&
                    newCol < COLS &&
                    currentBoard[newRow][newCol]?.color === currentBoard[row][col]?.color
                ) {
                    count++;
                    cells.push([newRow, newCol]);
                } else {
                    break;
                }
            }

            if (count >= 4) {
                return cells; // Return the winning cells instead of setting them directly
            }
        }
        return null; // Return null if no winning combination is found
    };

    const checkDraw = (board) => {
        return board.every((row) => row.every((cell) => cell !== null));
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
                    setWinningCells([]); // Reset winning cells if no win is found
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

    const aiMove = () => {
        setAiThinking(true);
        setThinkingTime(0);
        thinkingIntervalRef.current = setInterval(() => {
            setThinkingTime(prevTime => prevTime + 1);
        }, 1000);

        aiTimeoutRef.current = setTimeout(async () => {
            try {
                let aiDifficulty;
                if (gameMode === 'pve') {
                    aiDifficulty = aiDifficultyYellow;
                } else if (gameMode === 'eve') {
                    aiDifficulty =
                        currentPlayer === 'red'
                            ? aiDifficultyRed
                            : aiDifficultyYellow;
                } else {
                    aiDifficulty = 'easy';
                }

                const response = await fetch(
                    'https://connect4-api.vahidr.com/ai-move',
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
            } finally {
                setAiThinking(false);
                clearInterval(thinkingIntervalRef.current);
            }
        }, 500);
    };

    useEffect(() => {
        if (!isAnimating && !winner && !isDraw && !isReviewMode) {
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
        return () => {
            if (aiTimeoutRef.current) {
                clearTimeout(aiTimeoutRef.current);
                aiTimeoutRef.current = null;
            }
            if (thinkingIntervalRef.current) {
                clearInterval(thinkingIntervalRef.current);
            }
        };
    }, [currentPlayer, isAnimating, winner, isDraw, gameMode, isReviewMode]);

    const getPlayerName = (color) => {
        if (gameMode === 'pve') {
            return color === 'red' ? 'Red Player' : 'AI';
        } else if (gameMode === 'eve') {
            return color === 'red' ? 'AI (Red)' : 'AI (Yellow)';
        } else {
            return `${color.charAt(0).toUpperCase() + color.slice(1)} Player`;
        }
    };

    // New function to check for winning move
    const checkForWinningMove = (player) => {
        for (let col = 0; col < COLS; col++) {
            const tempBoard = board.map(row => [...row]);
            for (let row = ROWS - 1; row >= 0; row--) {
                if (!tempBoard[row][col]) {
                    tempBoard[row][col] = { color: player };
                    if (checkWinner(row, col, tempBoard)) {
                        return col;
                    }
                    break;
                }
            }
        }
        return null;
    };

    // Effect for cheat mode
    useEffect(() => {
        if (isCheatMode && !winner && !isDraw) {
            const winningCol = checkForWinningMove(currentPlayer);
            setWinningMove(winningCol);
        } else {
            setWinningMove(null);
        }
    }, [board, currentPlayer, isCheatMode, winner, isDraw]);

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
                            onChange={() => setAiDifficultyYellow('expert')}/>
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
    
        const GameBoard = () => {
            const isMobile = windowSize.width <= 768;
            const [isMoveLogOpen, setIsMoveLogOpen] = useState(false);
        
            const MoveLog = () => (
                <div className="move-log">
                    <h3>Move Log</h3>
                    <ul>
                        {moves.map((move) => (
                            <li key={move.moveNumber}>
                                Move {move.moveNumber}: {getPlayerName(move.player)} placed in column {move.col + 1}
                            </li>
                        ))}
                    </ul>
                </div>
            );
        
            const MoveNavigation = () => (
                <div className="move-navigation">
                    <button
                        onClick={() => {
                            setCurrentMoveIndex(0);
                            setBoard(moveHistory[0]);
                        }}
                        disabled={currentMoveIndex === 0}
                    >
                        First
                    </button>
                    <button
                        onClick={() => {
                            setCurrentMoveIndex((prevIndex) => {
                                const newIndex = Math.max(0, prevIndex - 1);
                                setBoard(moveHistory[newIndex]);
                                return newIndex;
                            });
                        }}
                        disabled={currentMoveIndex === 0}
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => {
                            setCurrentMoveIndex((prevIndex) => {
                                const newIndex = Math.min(moveHistory.length - 1, prevIndex + 1);
                                setBoard(moveHistory[newIndex]);
                                return newIndex;
                            });
                        }}
                        disabled={currentMoveIndex === moveHistory.length - 1}
                    >
                        Next
                    </button>
                    <button
                        onClick={() => {
                            setCurrentMoveIndex(moveHistory.length - 1);
                            setBoard(moveHistory[moveHistory.length - 1]);
                        }}
                        disabled={currentMoveIndex === moveHistory.length - 1}
                    >
                        Last
                    </button>
                </div>
            );
        
            return (
                <div className="game-board">
                <h2>
                    {winner
                        ? `${getPlayerName(winner)} Wins!`
                        : isDraw
                        ? "It's a draw!"
                        : `Current Player: ${getPlayerName(currentPlayer)}`}
                </h2>
                {aiThinking && (
                    <p className="ai-thinking">AI Thinking...{thinkingTime}s</p>
                )}
                    <div className="game-content">
                        {isReviewMode && (
                            <div className="review-mode">
                                <h3>Review Mode</h3>
                                <MoveNavigation />
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
                        {!isMobile && <MoveLog />}
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
                                        <MoveLog />
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
    
        return (
            <div className="connect4">
                {gameMode === 'menu' && <MainMenu />}
                {(gameMode === 'pvp' || gameMode === 'pve' || gameMode === 'eve') && (
                    <GameBoard />
                )}
            </div>
        );
    };
    
    export default Connect4;