export interface Item {
  id: string;
  type: 'block';
  color: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface Agent {
  id: number;
  name: string;
  type: string; // e.g. 'leader', 'scientist'
  color: string;
  position: { x: number; y: number };
  status: string; // e.g. 'active', 'thinking'
  speed: number;
  radius: number;
  dialogue: string;
  emote: 'happy' | 'sad' | 'thinking' | 'surprised' | null;
  canSeeMap: boolean;
  memory: string[];
  behavior: {
    action: 'chase' | 'flee' | 'wander' | 'moveTo' | 'interact';
    targetAgentId: number | null; 
    targetItemId: string | null;
    targetPosition: { x: number, y: number } | null;
  };
}

export interface SimulationConfig {
  description: string;
  duration: number;
  world: {
    width: number;
    height: number;
  };
  agents: Agent[];
  items: Item[];
}

export interface DirectorUpdate {
    narration: string;
    agentUpdates: {
        agentId: number;
        dialogue: string;
        emote: Agent['emote'];
        canSeeMap?: boolean;
        status?: string;
        newMemory?: string;
        behavior: Agent['behavior'];
    }[];
    newItems?: Item[];
    removedAgentIds?: number[];
}