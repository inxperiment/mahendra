import { GoogleGenAI, Type } from "@google/genai";
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import type { SimulationConfig, DirectorUpdate, Agent, Item } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const itemSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: 'A unique identifier for the item (e.g., "block-1").' },
        type: { type: Type.STRING, description: "The type of item, currently only 'block'." },
        color: { type: Type.STRING, description: 'A hex color code for the item.' },
        position: {
            type: Type.OBJECT,
            properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } },
            required: ['x', 'y'],
        },
        size: {
             type: Type.OBJECT,
            properties: { width: { type: Type.NUMBER }, height: { type: Type.NUMBER } },
            required: ['width', 'height'],
        }
    },
    required: ['id', 'type', 'color', 'position', 'size'],
};

const agentSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.INTEGER },
        name: { type: Type.STRING, description: "The agent's unique name." },
        type: { type: Type.STRING, description: "The agent's role or personality (e.g., 'leader', 'builder')." },
        color: { type: Type.STRING, description: 'A vibrant, unique hex color code for the agent.' },
        position: {
            type: Type.OBJECT,
            properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } },
            required: ['x', 'y'],
        },
        status: { type: Type.STRING, description: "A one-word status like 'active', 'hiding', 'found', or 'building'." },
        speed: { type: Type.NUMBER },
        radius: { type: Type.NUMBER, description: 'The visual size of the agent.' },
        dialogue: { type: Type.STRING, description: 'A brief starting line of dialogue, can be empty.' },
        emote: { type: Type.STRING, nullable: true, description: "Initial emote, should be null." },
        canSeeMap: { type: Type.BOOLEAN, description: 'Whether the agent is aware of the whole map. Default to true.'},
        memory: { type: Type.ARRAY, description: "The agent's memory. Should be an empty array initially.", items: { type: Type.STRING } },
        behavior: {
            type: Type.OBJECT,
            properties: {
                action: { type: Type.STRING, description: "'chase', 'flee', 'wander', 'moveTo', or 'interact'." },
                targetAgentId: { type: Type.INTEGER, nullable: true },
                targetItemId: { type: Type.STRING, nullable: true },
                targetPosition: {
                    type: Type.OBJECT,
                    properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } },
                    nullable: true
                },
            },
            required: ['action', 'targetAgentId', 'targetItemId', 'targetPosition'],
        },
    },
    required: ['id', 'name', 'type', 'color', 'position', 'status', 'speed', 'radius', 'dialogue', 'emote', 'canSeeMap', 'memory', 'behavior'],
};

const initialSceneSchema = {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING, description: 'A brief summary of the simulation scenario.' },
    duration: { type: Type.INTEGER, description: 'The total duration of the simulation in seconds. Should be between 30 and 120.' },
    world: {
      type: Type.OBJECT,
      properties: { width: { type: Type.INTEGER }, height: { type: Type.INTEGER } },
      required: ['width', 'height'],
    },
    agents: {
      type: Type.ARRAY,
      description: "A list of exactly 4 agents.",
      items: agentSchema,
    },
    items: {
      type: Type.ARRAY,
      description: "A list of any initial items for the scene. Can be empty.",
      items: itemSchema,
    }
  },
  required: ['description', 'duration', 'world', 'agents', 'items'],
};

const directorUpdateSchema = {
    type: Type.OBJECT,
    properties: {
        narration: { type: Type.STRING, description: "The director's brief narration of the current scene." },
        agentUpdates: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    agentId: { type: Type.INTEGER },
                    dialogue: { type: Type.STRING, description: "The agent's new line of dialogue." },
                    emote: { type: Type.STRING, nullable: true, description: "An emote for the agent: 'happy', 'sad', 'thinking', 'surprised', or null." },
                    canSeeMap: { type: Type.BOOLEAN, nullable: true, description: "Optionally change the agent's map awareness."},
                    status: { type: Type.STRING, nullable: true, description: "Optionally update the agent's status (e.g., 'found', 'finished')." },
                    newMemory: { type: Type.STRING, nullable: true, description: "A new, brief memory to add for the agent based on recent events (e.g. 'collided with Bob')." },
                    behavior: {
                        type: Type.OBJECT,
                        properties: {
                            action: { type: Type.STRING, description: "'chase', 'flee', 'wander', 'moveTo', or 'interact'." },
                            targetAgentId: { type: Type.INTEGER, nullable: true },
                            targetItemId: { type: Type.STRING, nullable: true },
                            targetPosition: { 
                                type: Type.OBJECT, 
                                properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }, 
                                nullable: true 
                            },
                        },
                         required: ['action', 'targetAgentId', 'targetItemId', 'targetPosition'],
                    },
                },
                 required: ['agentId', 'dialogue', 'emote', 'behavior'],
            }
        },
        newItems: {
            type: Type.ARRAY,
            nullable: true,
            description: "A list of new items to summon into the world. Can be empty.",
            items: itemSchema,
        },
        removedAgentIds: {
            type: Type.ARRAY,
            nullable: true,
            description: "A list of agent IDs to permanently remove from the simulation. Use this for eliminations or when a character leaves the scene.",
            items: { type: Type.INTEGER },
        }
    },
    required: ['narration', 'agentUpdates'],
}

export const generateInitialScene = async (prompt: string): Promise<SimulationConfig> => {
  const systemInstruction = `You are an AI assistant that designs 2D multi-agent simulations. Based on the user's request, generate a valid JSON object defining the initial scene.
- The simulation must have exactly 4 agents. Give them distinct names, personalities/types, and colors.
- The simulation takes place in a ${WORLD_WIDTH}x${WORLD_HEIGHT} unit space. All agents and items must have starting positions within these boundaries.
- Set a reasonable 'duration' in seconds for the scenario (e.g., 60 seconds for a game of hide and seek).
- Agent speeds should be between 1 and 3. Radius (which controls character size) should be between 10 and 16.
- Set initial behavior to 'wander', initial emote to null, 'canSeeMap' to true, and 'memory' to an empty array for all agents.
- If the prompt implies items are needed (e.g., building), you can add them to the 'items' array. Otherwise, 'items' should be an empty array.
- The user prompt is: "${prompt}"`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{text: "Generate the initial simulation scene based on my instructions."}] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: initialSceneSchema,
      },
    });

    const jsonString = response.text.trim();
    const config = JSON.parse(jsonString);
    
    config.world.width = WORLD_WIDTH;
    config.world.height = WORLD_HEIGHT;
    if (config.agents.length !== 4) {
        throw new Error("Generated config does not have exactly 4 agents.");
    }
    // Ensure memory is initialized
    config.agents.forEach((agent: Agent) => agent.memory = []);

    return config as SimulationConfig;

  } catch (error) {
    console.error("Error generating initial scene:", error);
    throw new Error("Failed to generate a valid simulation from the prompt. Please try a different scenario.");
  }
};

export const getDirectorUpdate = async (agents: Agent[], items: Item[], scenarioDescription: string, collisions: number[][]): Promise<DirectorUpdate> => {
    const simplifiedAgents = agents.map(a => ({ id: a.id, name: a.name, type: a.type, position: a.position, status: a.status, dialogue: a.dialogue, canSeeMap: a.canSeeMap, memory: a.memory }));
    const systemInstruction = `You are the director of a 2D AI simulation. The scenario is: "${scenarioDescription}".
Current State:
- Agents: ${JSON.stringify(simplifiedAgents, null, 2)}
- Items: ${JSON.stringify(items, null, 2)}
- Recent Collisions: ${JSON.stringify(collisions)}

Your Directives:
1.  **CRITICAL: Handle Collisions.** You MUST react to collisions based on agent types.
    -   Example: If a 'predator' agent collides with a 'prey', remove the prey by adding its ID to 'removedAgentIds' and give the predator a memory of the event.
    -   Example: If a 'seeker' collides with a 'hider', update the hider's status to 'found' and change their behavior.
    -   Example: If friends collide, they might exchange dialogue.
2.  **Update Agent State.** For all agents that are NOT removed, provide an update in 'agentUpdates'.
    -   Use an agent's 'memory' to inform their next action.
    -   Add a 'newMemory' if a significant event occurred.
    -   Assign a new logical behavior: 'chase', 'flee', 'moveTo', 'interact', or 'wander'.
    -   Optionally update 'status', 'dialogue', 'emote', etc.
3.  **Narrate.** Provide a brief, one-sentence 'narration' of the current moment.
4.  **Manage World.** You can add 'newItems' or use 'removedAgentIds' to control the simulation.

Based on this, generate the JSON update.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{text: "Generate the director's update based on the current agent and item state."}] }],
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: directorUpdateSchema,
            },
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as DirectorUpdate;

    } catch (error) {
        console.error("Error getting director update:", error);
        throw new Error("The director AI failed to provide an update.");
    }
}