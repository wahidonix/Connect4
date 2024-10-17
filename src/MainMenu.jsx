import React from 'react';
import './Connect4.css';

const MainMenu = ({
    selectedGameMode,
    setSelectedGameMode,
    aiDifficultyRed,
    setAiDifficultyRed,
    aiDifficultyYellow,
    setAiDifficultyYellow,
    startGame
}) => {
    const difficultyLevels = ['easy', 'medium', 'hard', 'expert'];

    const renderDifficultyOptions = (currentDifficulty, setDifficulty, playerColor) => (
        <div className="ai-difficulty-selection">
            <h2>Select {playerColor} AI Difficulty:</h2>
            {difficultyLevels.map((level) => (
                <label key={level}>
                    <input
                        type="radio"
                        value={level}
                        checked={currentDifficulty === level}
                        onChange={() => setDifficulty(level)}
                    />
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                </label>
            ))}
        </div>
    );

    return (
        <div className="main-menu">
            <h1>Connect 4</h1>
<<<<<<< HEAD
            <div className='main-menu-container'>
=======
>>>>>>> 8cf3c29b6804fb0073bae5f4b0dec4182b75b2db
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

            {selectedGameMode === 'pve' && renderDifficultyOptions(aiDifficultyYellow, setAiDifficultyYellow, 'Yellow')}

            {selectedGameMode === 'eve' && (
                <>
                    {renderDifficultyOptions(aiDifficultyRed, setAiDifficultyRed, 'Red')}
                    {renderDifficultyOptions(aiDifficultyYellow, setAiDifficultyYellow, 'Yellow')}
                </>
            )}

<<<<<<< HEAD
        </div>
            <button className="start-game-button" onClick={startGame}>Start Game</button>
        </div>
        
=======
            <button className="start-game-button" onClick={startGame}>Start Game</button>
        </div>
>>>>>>> 8cf3c29b6804fb0073bae5f4b0dec4182b75b2db
    );
};

export default MainMenu;