import React from 'react';
import './Connect4.css';

const MoveNavigation = ({ currentMoveIndex, moveHistory, setCurrentMoveIndex, setBoard }) => {
    const goToMove = (index) => {
        setCurrentMoveIndex(index);
        setBoard(moveHistory[index]);
    };

    return (
        <div className="move-navigation">
            <button
                onClick={() => goToMove(0)}
                disabled={currentMoveIndex === 0}
            >
                First Move
            </button>
            <button
                onClick={() => goToMove(Math.max(0, currentMoveIndex - 1))}
                disabled={currentMoveIndex === 0}
            >
                Previous Move
            </button>
            <button
                onClick={() => goToMove(Math.min(moveHistory.length - 1, currentMoveIndex + 1))}
                disabled={currentMoveIndex === moveHistory.length - 1}
            >
                Next Move
            </button>
            <button
                onClick={() => goToMove(moveHistory.length - 1)}
                disabled={currentMoveIndex === moveHistory.length - 1}
            >
                Latest Move
            </button>
            <div className="move-info">
                Move {currentMoveIndex + 1} of {moveHistory.length}
            </div>
        </div>
    );
};

export default MoveNavigation;