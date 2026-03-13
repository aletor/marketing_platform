const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(process.cwd(), 'data', 'spaces-db.json');

if (!fs.existsSync(DB_PATH)) {
    console.log('No database file found to migrate.');
    process.exit(0);
}

try {
    const rawData = fs.readFileSync(DB_PATH, 'utf8');
    const oldData = JSON.parse(rawData);

    // Check if it's already migrated (project structure)
    if (oldData.length > 0 && oldData[0].spaces && !Array.isArray(oldData[0].nodes)) {
        console.log('Database already appears to be in Project format.');
        process.exit(0);
    }

    console.log(`Migrating ${oldData.length} spaces to Project format...`);

    const newData = oldData.map((oldSpace) => {
        // Each old space becomes a project
        const projectId = oldSpace.id || uuidv4();
        const rootSpaceId = projectId; // Use same ID or generated

        return {
            id: projectId,
            name: oldSpace.name || 'Untitled Project',
            rootSpaceId: rootSpaceId,
            spaces: {
                [rootSpaceId]: {
                    id: rootSpaceId,
                    name: 'Main Space',
                    nodes: oldSpace.nodes || [],
                    edges: oldSpace.edges || [],
                    createdAt: oldSpace.createdAt || new Date().toISOString(),
                    updatedAt: oldSpace.updatedAt || new Date().toISOString()
                }
            },
            createdAt: oldSpace.createdAt || new Date().toISOString(),
            updatedAt: oldSpace.updatedAt || new Date().toISOString()
        };
    });

    fs.writeFileSync(DB_PATH, JSON.stringify(newData, null, 2));
    console.log('Migration successful!');
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
}
