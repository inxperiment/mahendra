import React from 'react';
import type { Agent, Item } from '../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';

const EMOTE_MAP: { [key: string]: string } = {
    happy: '😊',
    sad: '😢',
    surprised: '😮',
    thinking: '🤔',
};

const Emote: React.FC<{ emote: Agent['emote'] }> = ({ emote }) => {
    if (!emote) return null;

    return (
        <div
            key={emote}
            className="absolute bottom-full mb-1 w-max px-2 py-0.5 bg-black/50 text-white text-lg rounded-full shadow-lg animate-fade-in-scale backdrop-blur-sm"
            style={{ transform: 'translateX(-50%)', left: '50%' }}
        >
            {EMOTE_MAP[emote] || emote}
        </div>
    );
};

const ItemView: React.FC<{ item: Item }> = ({ item }) => {
    return (
        <div
            className="absolute"
            style={{
                left: `${item.position.x}px`,
                top: `${item.position.y}px`,
                width: `${item.size.width}px`,
                height: `${item.size.height}px`,
                backgroundColor: item.color,
                transform: `translate(-50%, -50%)`,
                borderRadius: '4px',
                boxShadow: `0 2px 5px rgba(0,0,0,0.5), inset 0 0 8px rgba(0,0,0,0.3)`,
            }}
        ></div>
    );
};


const Character: React.FC<{ agent: Agent }> = ({ agent }) => {
    const headSize = agent.radius * 1.5;
    const bodyHeight = agent.radius * 1.8;
    const bodyWidth = agent.radius * 1.4;

    return (
        <div className="relative" style={{ width: headSize, height: headSize + bodyHeight / 2 }}>
            {/* Body */}
            <div
                className="absolute bottom-0 left-1/2 rounded-full"
                style={{
                    width: bodyWidth,
                    height: bodyHeight,
                    backgroundColor: agent.color,
                    transform: 'translateX(-50%)',
                    boxShadow: `0 2px 6px rgba(0,0,0,0.4)`,
                }}
            >
                <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 -5px 10px rgba(0,0,0,0.3)' }}></div>
            </div>
            {/* Head */}
            <div
                className="absolute top-0 left-1/2 rounded-full flex items-center justify-center"
                style={{
                    width: headSize,
                    height: headSize,
                    backgroundColor: agent.color,
                    transform: 'translateX(-50%)',
                    boxShadow: `0 0 12px ${agent.color}, 0 2px 6px rgba(0,0,0,0.6)`,
                }}
            >
                 <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 8px rgba(0,0,0,0.4)' }}></div>
                 {/* Eye Icon */}
                 <div className="relative w-4 h-4" title={agent.canSeeMap ? 'Aware' : 'Unaware'}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`absolute transition-opacity duration-300 text-white/80 ${agent.canSeeMap ? 'opacity-100' : 'opacity-0'}`}>
                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                        <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a.75.75 0 0 1 0-1.113Zm10.676-5.499a5.25 5.25 0 0 0-5.25 5.25c0 1.528.653 2.91 1.693 3.896l-1.22 1.22a.75.75 0 0 0 1.06 1.061l1.22-1.22a5.23 5.23 0 0 0 2.497.633 5.25 5.25 0 0 0 0-10.5Z" clipRule="evenodd" />
                    </svg>
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`absolute transition-opacity duration-300 text-white/60 ${!agent.canSeeMap ? 'opacity-100' : 'opacity-0'}`}>
                        <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18ZM22.676 12.553a11.249 11.249 0 0 1-2.631 4.31l-3.099-3.099a5.25 5.25 0 0 0-6.71-6.71L9.75 5.21a11.249 11.249 0 0 1 12.926 7.342Z" />
                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                        <path d="M1.375 12.109c1.458 4.43 5.71 7.641 10.625 7.641a11.22 11.22 0 0 0 4.31-2.631l-3.099-3.099a5.25 5.25 0 0 0-6.71-6.71L3.75 9.25a11.249 11.249 0 0 0-2.375 2.859Z" />
                    </svg>
                 </div>
            </div>
        </div>
    );
};


const AgentView: React.FC<{ agent: Agent }> = React.memo(({ agent }) => {
    const characterHeight = agent.radius * 1.5 + (agent.radius * 1.8) / 2;
    const memoryTooltip = `Memories:\n${agent.memory.length > 0 ? agent.memory.map(m => `- ${m}`).join('\n') : 'None'}`;

    return (
        <div
            className="absolute"
            style={{
                left: `${agent.position.x}px`,
                top: `${agent.position.y}px`,
                transform: `translate(-50%, -${characterHeight - agent.radius}px)`,
                width: agent.radius * 2,
            }}
            title={memoryTooltip}
        >
            <div className="relative flex flex-col items-center">
                {agent.dialogue && (
                    <div
                        key={agent.dialogue}
                        className="absolute bottom-full mb-2 w-max max-w-[200px] px-3 py-1.5 bg-black/60 text-white text-sm rounded-lg shadow-lg animate-fade-in-up backdrop-blur-sm"
                        style={{ 
                            transform: 'translateX(-50%)', 
                            left: '50%',
                            bottom: `${characterHeight + (agent.emote ? 20 : 0)}px`
                        }}
                    >
                        <span className="font-bold" style={{color: agent.color}}>{agent.name}: </span>
                        {agent.dialogue}
                        <div className="absolute top-full left-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-black/60 -translate-x-1/2"></div>
                    </div>
                )}
                 <div
                    className="absolute w-max"
                    style={{
                        bottom: `${characterHeight}px`,
                        left: '50%',
                        transform: 'translateX(-50%)',
                    }}
                >
                    <Emote emote={agent.emote} />
                </div>
                <Character agent={agent} />
            </div>
        </div>
    );
});

export const SimulationCanvas: React.FC<{ agents: Agent[], items: Item[] }> = ({ agents, items }) => {
    
    const drawableObjects = React.useMemo(() => [
        ...agents.map(a => ({ ...a, drawableType: 'agent' as const, zIndex: Math.round(a.position.y) })),
        ...items.map(i => ({ ...i, drawableType: 'item' as const, zIndex: Math.round(i.position.y) }))
    ].sort((a, b) => a.zIndex - b.zIndex), [agents, items]);


    return (
        <div 
            className="relative bg-[#0D1117] border-2 border-[#C952E7]/50 rounded-lg overflow-hidden shadow-2xl shadow-[#C952E7]/10"
            style={{ 
                width: WORLD_WIDTH, 
                height: WORLD_HEIGHT,
                backgroundImage: 'radial-gradient(circle, rgba(201, 82, 231, 0.08) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
            }}
        >
            {drawableObjects.map(obj => {
                if (obj.drawableType === 'agent') {
                     return <AgentView agent={obj} key={`agent-${obj.id}`} />
                }
                if (obj.drawableType === 'item') {
                    return <ItemView item={obj} key={`item-${obj.id}`} />
                }
                return null;
            })}
        </div>
    );
};
