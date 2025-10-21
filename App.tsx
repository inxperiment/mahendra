import React, { useState, useCallback } from 'react';
import { Controls } from './components/Controls';
import { SimulationCanvas } from './components/SimulationCanvas';
import { generateInitialScene } from './services/geminiService';
import { useSimulation } from './hooks/useSimulation';
import type { SimulationConfig } from './types';

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { agents, items, gameStatus, narration, timeLeft, startSimulation, resetSimulation, description, duration } = useSimulation();

    const handleSimulate = useCallback(async (prompt: string) => {
        setIsLoading(true);
        setError(null);
        resetSimulation();
        try {
            const config: SimulationConfig = await generateInitialScene(prompt);
            startSimulation(config);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [resetSimulation, startSimulation]);
    
    const handleReset = useCallback(() => {
        resetSimulation();
        setError(null);
    }, [resetSimulation]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-8">
            <header className="text-center mb-6">
                <h1 className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#C952E7] to-[#58A6FF]">
                    Inxperiments Mahendra
                </h1>
                <p className="text-gray-400 mt-2 max-w-2xl">
                    An AI-driven behavioral sandbox. Describe a scene, and the Director will bring it to life.
                </p>
            </header>
            
            <main className="w-full max-w-6xl mx-auto flex flex-col items-center gap-6">
                <div className="w-full lg:w-3/4">
                     <Controls onSimulate={handleSimulate} onReset={handleReset} isLoading={isLoading} gameStatus={gameStatus} />
                </div>
               
                {error && (
                    <div className="w-full lg:w-3/g p-4 text-center bg-red-900/50 border border-red-500 rounded-lg">
                        <p className="font-semibold">Error:</p>
                        <p>{error}</p>
                    </div>
                )}

                <div className="relative w-full flex justify-center">
                    {gameStatus === 'idle' && !isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D1117]/80 z-20 rounded-lg backdrop-blur-sm">
                            <p className="text-2xl text-gray-500">Enter a scenario to begin</p>
                        </div>
                    )}
                     {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D1117]/80 z-20 rounded-lg backdrop-blur-sm">
                             <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#C952E7]"></div>
                             <p className="mt-4 text-lg text-[#C952E7]">AI is creating the scene...</p>
                        </div>
                    )}
                    <SimulationCanvas agents={agents} items={items} />
                </div>
                 
                <div className="w-full lg:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                     {description && gameStatus !== 'idle' && (
                        <div className="w-full text-center p-3 bg-[#161B22]/80 rounded-lg border border-[#58A6FF]/20 backdrop-blur-sm">
                            <p className="text-gray-300"><span className="font-bold text-[#58A6FF]">Scenario:</span> {description}</p>
                        </div>
                    )}
                    {duration > 0 && gameStatus !== 'idle' && (
                         <div className="w-full text-center p-3 bg-[#161B22]/80 rounded-lg border border-[#58A6FF]/20 backdrop-blur-sm">
                            <p className="text-gray-300"><span className="font-bold text-[#58A6FF]">Time Left:</span> {timeLeft}s / {duration}s</p>
                        </div>
                    )}
                </div>

                {narration && gameStatus !== 'idle' && (
                     <div className="w-full lg:w-3/4 text-center mt-2 p-3 bg-[#161B22]/80 rounded-lg border border-[#C952E7]/30 shadow-lg backdrop-blur-sm">
                        <p className="text-gray-300 italic"><span className="font-bold not-italic text-[#C952E7]">Director:</span> "{narration}"</p>
                    </div>
                )}
            </main>
             <footer className="text-center mt-8 text-gray-500 text-sm">
                <p>Powered by Gemini and React</p>
            </footer>
        </div>
    );
};

export default App;