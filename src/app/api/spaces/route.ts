import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { deleteFromS3 } from '@/lib/s3-utils';

const DB_PATH = path.join(process.cwd(), 'data', 'spaces-db.json');

// Helper to ensure directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readDB() {
  if (!fs.existsSync(DB_PATH)) return [];
  const data = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(data);
}

function writeDB(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const spaces = readDB();
    return NextResponse.json(spaces);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read spaces' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { id, name, nodes, edges } = await req.json();
    const spaces = readDB();

    if (id) {
      const index = spaces.findIndex((s: any) => s.id === id);
      if (index !== -1) {
        spaces[index] = { 
          ...spaces[index], 
          name: name || spaces[index].name, 
          nodes, 
          edges, 
          updatedAt: new Date().toISOString() 
        };
      } else {
        return NextResponse.json({ error: 'Space not found' }, { status: 404 });
      }
    } else {
      const newSpace = {
        id: uuidv4(),
        name: name || `New Space ${spaces.length + 1}`,
        nodes,
        edges,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      spaces.push(newSpace);
    }

    writeDB(spaces);
    return NextResponse.json(spaces);
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed to save space' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const spaces = readDB();
    const spaceToDelele = spaces.find((s: any) => s.id === id);
    
    if (spaceToDelele) {
        console.log(`[Cleanup] Deleting space "${spaceToDelele.name}"...`);
        
        // Find all S3 keys in nodes
        const s3Keys = spaceToDelele.nodes
            .map((n: any) => n.data?.s3Key)
            .filter((key: string | undefined) => !!key);
        
        if (s3Keys.length > 0) {
            console.log(`[Cleanup] Found ${s3Keys.length} assets to remove from S3.`);
            for (const key of s3Keys) {
                try {
                    await deleteFromS3(key);
                    console.log(`[Cleanup] Successfully removed: ${key}`);
                } catch (err) {
                    console.error(`[Cleanup] Failed to remove ${key}:`, err);
                }
            }
        }
    }

    const filtered = spaces.filter((s: any) => s.id !== id);
    writeDB(filtered);
    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete space' }, { status: 500 });
  }
}
