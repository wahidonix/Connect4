import React from 'react';
import { getPlayerName } from './utils';
import './Connect4.css';

const MoveLog = ({ moves, gameMode }) => {
    return (
        <div className="move-log">
            <h3>Move Log</h3>
            <div className="move-list">
                {moves.length === 0 ? (
                    <p>No moves yet.</p>
                ) : (
                    <ul>
                        {moves.map((move, index) => (
                            <li key={index}>
                                Move {move.moveNumber}: {getPlayerName(move.player, gameMode)} placed in column {move.col + 1}
                                {move.isAiMove && <span className="ai-move"> (AI Move)</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default MoveLog;