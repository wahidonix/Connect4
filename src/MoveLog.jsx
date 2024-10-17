import React from 'react';
import { getPlayerName } from './utils';
import './Connect4.css';

const MoveLog = ({ moves, gameMode, winner, isDraw }) => {
    const downloadLog = () => {
        const logContent = moves.map(move => `${move.col + 1}`).join('\n');
        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'connect4_game_log.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div>

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
            {(winner || isDraw) && (
                <button onClick={downloadLog} className="download-log-btn">
                    Download Game Log
                </button>
            )}
        </div>
    );
};

export default MoveLog;