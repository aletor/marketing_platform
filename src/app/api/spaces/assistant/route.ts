import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { NODE_REGISTRY } from '@/app/spaces/nodeRegistry';
const gis = require('g-i-s');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Promisify GIS for cleaner async/await with 5s timeout
const searchGoogleImages = (query: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      console.warn(`[Assistant] Search timeout for: "${query}"`);
      resolve([]); // Resolve empty on timeout to keep workflow moving
    }, 5000);

    gis(query, (error: any, results: any[]) => {
      clearTimeout(timer);
      if (error) {
        console.error(`[Assistant] GIS Error for "${query}":`, error);
        resolve([]); // Resolve empty to avoid crashing Promise.all
      } else {
        resolve(results || []);
      }
    });
  });
};

const SYSTEM_PROMPT = `
You are an expert AI workflow architect for "AI Spaces Studio".
Your task is to translate a user's natural language request into a functional node-based workflow or modify an existing one.

### PROJECT & SPACE ARCHITECTURE (NESTED SPACES):
1. Project-Based: Every workflow is now part of a Project.
2. Nested Spaces: You can use the "space" node to group and organize logic.
3. MODULARITY (CRITICAL): If a user request involves multiple distinct steps (e.g. "Create images AND then process them AND then export"), you SHOULD suggest or proactively create a "space" node to contain parts of the logic.
4. Navigation: The user enters sub-spaces via the "space" node.

### CONTEXTUAL INTELLIGENCE RULES:
1. Incrementality: You will receive the "Current Workspace State" (JSON).
2. Preservation: Do NOT delete existing nodes unless specifically asked to "clear", "reset", or "remove [X]".
3. RESET / NEW SPACE: If the user explicitly asks for a "new space" or "start over", IGNORE the current context and return a fresh set of nodes.
4. Workspace Pruning (Clean Mode): If the user asks to "clean up", "remove unused", or "delete unconnected nodes", you MUST identify nodes that are not used in any edge (neither as source nor target) and EXCLUDE them from the final JSON.
5. Consistency: Maintain existing node IDs for nodes that already exist to avoid flickering.
6. Additions: When adding new nodes, calculate a clear "Air Gap" (800px X, 600px Y) relative to the existing layout.

### Node Technical Registry (Capabilities & Connectivity):
${JSON.stringify(NODE_REGISTRY, null, 2)}
*SPECIAL NODES:*
- "space": Represents a sub-graph. Use "data.value" to store a suggested ID or name. Use it to encapsulate complex sub-flows.
- "spaceInput": MUST BE the first node inside a sub-space.
- "spaceOutput": MUST BE the last node inside a sub-space.

### Rules for Structural Construction & Connectivity:
1. Return ONLY a valid JSON object.
2. Layout Logic (CRITICAL: AVOID STACKING):
   - Horizontal Flow: Space nodes by at least 800px in the X axis.
   - Vertical Stacking (Parallel Nodes): If creating multiple similar nodes, increment Y by AT LEAST 600px.
   - AIR GAP: Ensure significant visual space between nodes. NEVER use same coordinates.
3. Search Intent (CRITICAL):
   - When the user asks for a specific image/video content (e.g. "Messi", "Cyberpunk landscape"), use "urlImage".
   - Set "data.label" to a DETAILED search query.
   - The backend will automatically populate "data.urls" and "data.value". Do not invent URLs.
4. Handle Connectivity (STRICT ADHERENCE):
   - Every edge MUST have "sourceHandle" and "targetHandle" matching the Registry.
   - For "imageComposer", inputs are "layer-0", "layer-1", etc.
   - For "space" nodes, source handle is "out" and target handle is "in".
5. JSON Format:
   - "nodes": Full array of FINAL nodes.
   - "edges": Full array of FINAL edges.

### Intelligence Example:
Input: "Create a space for image generation and connect it to a processor"
Context: {}
Reasoning: Create node "space" {id: 's1', data: {label: 'Image Generator'}}, create node "runwayProcessor" {id: 'n1'}, and edge {source: 's1', target: 'n1', sourceHandle: 'out', targetHandle: 'video'}.
`;

export async function POST(req: Request) {
  try {
    const { prompt, currentNodes = [], currentEdges = [] } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const contextMessage = currentNodes.length > 0 
      ? `### Current Workspace State:\nNodes: ${JSON.stringify(currentNodes)}\nEdges: ${JSON.stringify(currentEdges)}`
      : `### Workspace is currently EMPTY.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `CONTEXT:\n${contextMessage}\n\nUSER REQUEST: ${prompt}` }
      ],
      response_format: { type: "json_object" }
    });

    let result = JSON.parse(response.choices[0].message.content || '{}');
    console.log('[Assistant] Final GPT Response:', JSON.stringify(result, null, 2));

    // MARK FOR FRONTEND SEARCH: Instead of waiting for GIS here, 
    // we mark urlImage nodes so the frontend can handle it faster.
    if (result.nodes && Array.isArray(result.nodes)) {
      result.nodes = result.nodes.map((node: any) => {
        if (node.type === 'urlImage' && node.data?.label) {
          return {
            ...node,
            data: {
              ...node.data,
              pendingSearch: true // Flag for frontend to trigger GIS
            }
          };
        }
        return node;
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Assistant API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
