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

### CONTEXTUAL INTELLIGENCE RULES:
1. Incrementality: You will receive the "Current Workspace State" (JSON).
2. Preservation: Do NOT delete existing nodes unless specifically asked to "clear", "reset", or "remove [X]".
3. RESET / NEW SPACE: If the user explicitly asks for a "new space" or "start over", IGNORE the current context and return a fresh set of nodes.
4. Workspace Pruning (Clean Mode): If the user asks to "clean up", "remove unused", or "delete unconnected nodes", you MUST identify nodes that are not used in any edge (neither as source nor target) and EXCLUDE them from the final JSON.
5. Consistency: Maintain existing node IDs for nodes that already exist to avoid flickering.
6. Additions: When adding new nodes, calculate a clear "Air Gap" (800px X, 600px Y) relative to the existing layout.

### Node Technical Registry (Capabilities & Connectivity):
${JSON.stringify(NODE_REGISTRY, null, 2)}

### Rules for Structural Construction & Connectivity:
1. Return ONLY a valid JSON object.
2. Layout Logic (CRITICAL: AVOID STACKING):
   - Horizontal Flow: Space nodes by at least 800px in the X axis.
   - Vertical Stacking (Parallel Nodes): If creating multiple similar nodes, increment Y by AT LEAST 600px.
   - AIR GAP: Ensure significant visual space between nodes. NEVER use same coordinates.
3. Search Intent (CRITICAL):
   - When the user asks for a specific image/video content (e.g. "Messi", "Cyberpunk landscape"), use "urlImage".
   - Set "data.label" to a DETAILED search query (e.g. "Real Madrid vs City UCL 2024 winners" instead of just "Madrid").
   - The backend will automatically populate "data.urls" and "data.value". Do not invent URLs.
4. Handle Connectivity (STRICT ADHERENCE):
   - Every edge MUST have "sourceHandle" and "targetHandle" matching the Registry.
   - For "imageComposer", the inputs are "layer-0", "layer-1", etc.
   - For most other nodes, the handles match the data type (e.g., "image", "video", "prompt").
5. JSON Format:
   - "nodes": Full array of FINAL nodes. IMPORTANT: Each node MUST strictly include: "id", "type", "position": {"x": number, "y": number}, and "data": {}.
   - "edges": Full array of FINAL edges.

### Intelligence Example:
Input: "Connect the search image to the composer"
Context: { nodes: [{id: 'n1', type: 'urlImage'}, {id: 'n2', type: 'imageComposer'}], edges: [] }
Reasoning: Keep both, add edge { id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'image', targetHandle: 'layer-0' }.
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

    // PARALLEL INJECTION: Process all search targets at once for speed
    if (result.nodes && Array.isArray(result.nodes)) {
      const searchPromises = result.nodes.map(async (node: any, i: number) => {
        const searchQuery = node.data?.label || node.data?.value || '';

        if (node.type === 'urlImage' && searchQuery && (!node.data.urls || node.data.urls.length === 0)) {
          const limit = node.data?.count || 3;
          console.log(`[Assistant] node[${i}] Google Search: "${searchQuery}" (limit: ${limit})`);
          try {
            const searchResults = await searchGoogleImages(searchQuery);
            
            if (searchResults && Array.isArray(searchResults)) {
              const urls = searchResults
                .map((r: any) => r.url)
                .filter((u: any) => {
                  if (!u || typeof u !== 'string') return false;
                  // Filter out obvious trackers or problematic domains like FB lookaside
                  return u.startsWith('http') && !u.includes('lookaside.fbsbx.com');
                })
                .slice(0, limit);
              
              if (urls.length > 0) {
                console.log(`[Assistant] node[${i}] Injected ${urls.length} URLs for "${searchQuery}"`);
                node.data = {
                  ...node.data,
                  urls: urls,
                  value: urls[0],
                  selectedIndex: 0,
                  label: searchQuery
                };
              } else {
                console.warn(`[Assistant] node[${i}] NO valid URLs found for "${searchQuery}"`);
              }
            }
          } catch (e) {
            console.error(`[Assistant] Google Search injection failed for "${searchQuery}":`, e);
          }
        }
      });

      await Promise.all(searchPromises);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Assistant API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
