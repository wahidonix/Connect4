import { ROWS, COLS, GAME_MODES } from './constants';

export const checkWinner = (row, col, board) => {
    const directions = [
        [0, 1], // horizontal
        [1, 0], // vertical
        [1, 1], // diagonal right
        [1, -1] // diagonal left
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
                board[newRow][newCol]?.color === board[row][col]?.color
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
                board[newRow][newCol]?.color === board[row][col]?.color
            ) {
                count++;
                cells.push([newRow, newCol]);
            } else {
                break;
            }
        }

        if (count >= 4) {
            return cells;
        }
    }
    return null;
};

export const checkDraw = (board) => {
    return board.every(row => row.every(cell => cell !== null));
};

export const getPlayerName = (color, gameMode) => {
    if (gameMode === GAME_MODES.PVE) {
        return color === 'red' ? 'Red Player' : 'AI';
    } else if (gameMode === GAME_MODES.EVE) {
        return color === 'red' ? 'AI (Red)' : 'AI (Yellow)';
    } else {
        return `${color.charAt(0).toUpperCase() + color.slice(1)} Player`;
    }
};

export const checkForWinningMove = (board, player) => {
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

export const getAvailableColumns = (board) => {
    return board[0].reduce((acc, cell, index) => {
        if (cell === null) {
            acc.push(index);
        }
        return acc;
    }, []);
};