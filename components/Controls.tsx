import React, { useState } from 'react';

interface ControlsProps {
    onSimulate: (prompt: string) => void;
    onReset: () => void;
    isLoading: boolean;
    gameStatus: 'idle' | 'running' | 'paused' | 'ended';
}

const examplePrompts = [
    "Four characters are stuck on a desert island. One is a pragmatic leader, one is a nervous scientist, one is a cheerful optimist, and one is a cynical loner.",
    "A haunted mansion with four ghost hunters. One is brave, one is skeptical, one is tech-savvy, and one is easily scared.",
    "Four little builders are tasked with creating a wall. The director will give them blocks to build with.",
    "A space crew on a long journey. The captain, the engineer, the biologist, and the ship's AI (represented as a character). They just received a strange signal.",
];

export const Controls: React.FC<ControlsProps> = ({ onSimulate, onReset, isLoading, gameStatus }) => {
    const [prompt, setPrompt] = useState('');

    const handleSimulateClick = () => {
        if (prompt.trim()) {
            onSimulate(prompt);
        }
    };
    
    const handleExampleClick = () => {
        const randomPrompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
        setPrompt(randomPrompt);
    };

    return (
        <div className="p-4 bg-[#161B22]/80 rounded-lg shadow-lg border border-[#C952E7]/30 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 text-[#C952E7]">Simulation Scenario</h2>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe a scene with 4 characters..."
                className="w-full h-28 p-2 rounded bg-[#0D1117] border border-gray-700 focus:ring-2 focus:ring-[#C952E7] focus:outline-none transition-shadow"
                disabled={isLoading || gameStatus === 'running'}
            />
            <div className="flex items-center justify-between mt-4">
                <button
                    onClick={handleExampleClick}
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors disabled:opacity-50 border border-gray-700"
                    disabled={isLoading || gameStatus === 'running'}
                >
                    Try an Example
                </button>
                <div>
                    {gameStatus !== 'idle' && (
                         <button
                            onClick={onReset}
                            className="px-6 py-2 bg-transparent text-[#58A6FF] font-semibold rounded-md hover:bg-[#58A6FF]/10 border border-[#58A6FF]/50 transition-colors disabled:opacity-50 mr-2"
                            disabled={isLoading}
                        >
                            Reset
                        </button>
                    )}
                    <button
                        onClick={handleSimulateClick}
                        className="px-6 py-2 bg-[#C952E7] text-white font-semibold rounded-md hover:bg-[#b548cf] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(201,82,231,0.4)]"
                        disabled={isLoading || !prompt.trim() || gameStatus === 'running'}
                    >
                        {isLoading ? 'Generating...' : 'Simulate'}
                    </button>
                </div>
            </div>
        </div>
    );
};