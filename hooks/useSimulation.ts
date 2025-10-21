import { useState, useCallback, useRef, useEffect } from 'react';
import type { Agent, SimulationConfig, Item } from '../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { getDirectorUpdate } from '../services/geminiService';

type GameStatus = 'idle' | 'running' | 'paused' | 'ended';

const calculateDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

const RENDER_FPS = 30;
const MEMORY_LIMIT = 5;

export const useSimulation = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
    const [narration, setNarration] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);
    
    const simulationConfigRef = useRef<SimulationConfig | null>(null);
    const agentsRef = useRef<Agent[]>([]);
    const itemsRef = useRef<Item[]>([]);
    const animationFrameId = useRef<number>(0);
    const directorIntervalId = useRef<number>(0);
    const timerIntervalId = useRef<number>(0);
    const collisionPairsSinceLastUpdate = useRef<Set<string>>(new Set());

    const stopAllIntervals = useCallback(() => {
        if (directorIntervalId.current) clearInterval(directorIntervalId.current);
        if (timerIntervalId.current) clearInterval(timerIntervalId.current);
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        directorIntervalId.current = 0;
        timerIntervalId.current = 0;
        animationFrameId.current = 0;
    }, []);

    const endSimulation = useCallback(() => {
        setGameStatus('ended');
        stopAllIntervals();
        setNarration(prev => prev + " The simulation has ended.");
    }, [stopAllIntervals]);

    const resetSimulation = useCallback(() => {
        setGameStatus('idle');
        setAgents([]);
        setItems([]);
        setNarration('');
        setTimeLeft(0);
        simulationConfigRef.current = null;
        agentsRef.current = [];
        itemsRef.current = [];
        collisionPairsSinceLastUpdate.current.clear();
        stopAllIntervals();
    }, [stopAllIntervals]);

    const handleDirectorUpdate = useCallback(async () => {
        if (gameStatus === 'ended' || gameStatus === 'idle' || !simulationConfigRef.current) return;
        
        const collisions = Array.from(collisionPairsSinceLastUpdate.current).map(p => p.split('-').map(Number));
        collisionPairsSinceLastUpdate.current.clear();
        
        try {
            const update = await getDirectorUpdate(agentsRef.current, itemsRef.current, simulationConfigRef.current.description, collisions);
            setNarration(update.narration);
            
            if (update.removedAgentIds && update.removedAgentIds.length > 0) {
                const removedIds = new Set(update.removedAgentIds);
                agentsRef.current = agentsRef.current.filter(a => !removedIds.has(a.id));
            }

            if (update.newItems && update.newItems.length > 0) {
                itemsRef.current.push(...update.newItems);
                setItems([...itemsRef.current]);
            }

            for (const agentUpdate of update.agentUpdates) {
                const agent = agentsRef.current.find(a => a.id === agentUpdate.agentId);
                if (agent) {
                    agent.dialogue = agentUpdate.dialogue;
                    agent.emote = agentUpdate.emote;
                    agent.behavior = agentUpdate.behavior;
                    if (agentUpdate.status) agent.status = agentUpdate.status;
                    if (agentUpdate.canSeeMap !== undefined) agent.canSeeMap = agentUpdate.canSeeMap;
                    if (agentUpdate.newMemory) {
                        agent.memory.push(agentUpdate.newMemory);
                        if (agent.memory.length > MEMORY_LIMIT) {
                            agent.memory.shift();
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Director update failed", e);
            setNarration("The Director seems to be having trouble...");
        }
    }, [gameStatus]);

    const gameLoop = useCallback(() => {
        if (gameStatus !== 'running') return;

        const currentAgents = agentsRef.current;
        const currentItems = itemsRef.current;

        for (const agent of currentAgents) {
            const { behavior } = agent;
            let targetAgent = behavior.targetAgentId !== null ? currentAgents.find(a => a.id === behavior.targetAgentId) : null;
            let targetItem = behavior.targetItemId !== null ? currentItems.find(i => i.id === behavior.targetItemId) : null;

            let dx = 0, dy = 0;
            let actionTargetPos: {x: number, y: number} | null = null;
            
            if (behavior.action === 'chase' && targetAgent) actionTargetPos = targetAgent.position;
            else if (behavior.action === 'flee' && targetAgent) actionTargetPos = targetAgent.position;
            else if (behavior.action === 'moveTo' && behavior.targetPosition) actionTargetPos = behavior.targetPosition;
            else if (behavior.action === 'interact' && targetItem) actionTargetPos = targetItem.position;

            if (actionTargetPos) {
                const dist = calculateDistance(agent.position, actionTargetPos);
                const stopDistance = agent.radius + (targetAgent ? targetAgent.radius : (targetItem ? targetItem.size.width / 2 : 0));
                if (dist > stopDistance) {
                    const angle = Math.atan2(actionTargetPos.y - agent.position.y, actionTargetPos.x - agent.position.x);
                    const direction = behavior.action === 'flee' ? -1 : 1;
                    dx = Math.cos(angle) * agent.speed * direction;
                    dy = Math.sin(angle) * agent.speed * direction;
                } else if (behavior.action === 'moveTo' || behavior.action === 'interact') {
                    agent.behavior = { action: 'wander', targetAgentId: null, targetItemId: null, targetPosition: null };
                }
            } else { // Wander
                const wanderAngle = (Math.random() - 0.5) * 0.5 + (agent['wanderAngle'] || 0);
                agent['wanderAngle'] = wanderAngle;
                dx = Math.cos(wanderAngle) * agent.speed;
                dy = Math.sin(wanderAngle) * agent.speed;
            }
            
            agent.position.x += dx;
            agent.position.y += dy;
        }

        for (let i = 0; i < currentAgents.length; i++) {
            for (let j = i + 1; j < currentAgents.length; j++) {
                const agentA = currentAgents[i];
                const agentB = currentAgents[j];
                const distance = calculateDistance(agentA.position, agentB.position);
                const minDistance = agentA.radius + agentB.radius;
                if (distance < minDistance) {
                    const pairKey = [agentA.id, agentB.id].sort().join('-');
                    collisionPairsSinceLastUpdate.current.add(pairKey);
                    const overlap = minDistance - distance;
                    const angle = Math.atan2(agentB.position.y - agentA.position.y, agentB.position.x - agentA.position.x);
                    const moveX = (overlap / 2) * Math.cos(angle);
                    const moveY = (overlap / 2) * Math.sin(angle);
                    agentA.position.x -= moveX;
                    agentA.position.y -= moveY;
                    agentB.position.x += moveX;
                    agentB.position.y += moveY;
                }
            }
        }

        for (const agent of currentAgents) {
            agent.position.x = Math.max(agent.radius, Math.min(WORLD_WIDTH - agent.radius, agent.position.x));
            agent.position.y = Math.max(agent.radius, Math.min(WORLD_HEIGHT - agent.radius, agent.position.y));
        }

        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [gameStatus]);

    const startSimulation = useCallback((config: SimulationConfig) => {
        resetSimulation();
        simulationConfigRef.current = config;
        agentsRef.current = JSON.parse(JSON.stringify(config.agents));
        itemsRef.current = JSON.parse(JSON.stringify(config.items || []));
        setAgents(agentsRef.current);
        setItems(itemsRef.current);
        setGameStatus('running');
        setNarration('The scene begins...');
        setTimeLeft(config.duration);
        
        timerIntervalId.current = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    endSimulation();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        setTimeout(handleDirectorUpdate, 1000); // Initial update
        directorIntervalId.current = window.setInterval(handleDirectorUpdate, 8000);

        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [resetSimulation, endSimulation, handleDirectorUpdate, gameLoop]);

    useEffect(() => {
        if (gameStatus !== 'running') return;

        const renderInterval = setInterval(() => {
            // Deep copy to ensure React's memoization doesn't skip re-renders
            setAgents(JSON.parse(JSON.stringify(agentsRef.current)));
        }, 1000 / RENDER_FPS);

        return () => clearInterval(renderInterval);
    }, [gameStatus]);
    
    return { agents, items, gameStatus, narration, timeLeft, startSimulation, resetSimulation, description: simulationConfigRef.current?.description, duration: simulationConfigRef.current?.duration ?? 0 };
};