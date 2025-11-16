export const TILE_TYPE = {
    GRASS: 0,
    TREE: 1,
    LOGS: 2,
    BUSHES: 3,
};

export class Map {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.grassTile = null;
        this.treeTile = null;
        this.logsTile = null;
        this.bushesTile = null;
        this.grid = [];
        this.viewportWidth = 0;
        this.viewportHeight = 0;
    }

    setViewport(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }

    setTileSize(size) {
        this.tileSize = size;
    }

    async loadAssets() {
        const loadTile = (src) => new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
        });

        await Promise.all([
            loadTile('./grass_tile.png').then(img => this.grassTile = img),
            loadTile('./tree.png').then(img => this.treeTile = img),
            loadTile('./logs.png').then(img => this.logsTile = img),
            loadTile('./bushes.png').then(img => this.bushesTile = img)
        ]);
        
        this.generateMap();
    }
    
    generateMap() {
        console.log(`Generating map of size ${this.width}x${this.height}.`);
        this.grid = [];
        const TREE_CHANCE = 1 / 16;
        
        for (let j = 0; j < this.height; j++) {
            this.grid[j] = [];
            for (let i = 0; i < this.width; i++) {
                // 1/16 chance to spawn a tree (1)
                this.grid[j][i] = (Math.random() < TREE_CHANCE) ? TILE_TYPE.TREE : TILE_TYPE.GRASS;
            }
        }
    }
    
    isColliding(gridX, gridY) {
        // Check map bounds
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
            return true; 
        }
        
        // 1 means Tree/Obstacle
        return this.grid[gridY][gridX] === TILE_TYPE.TREE;
    }

    findNearest(x, y, tileType) {
        let nearest = null;
        let minDistance = Infinity;

        for (let j = 0; j < this.height; j++) {
            for (let i = 0; i < this.width; i++) {
                if (this.grid[j][i] === tileType) {
                    const dx = i - x;
                    const dy = j - y;
                    const distance = dx * dx + dy * dy; // Use squared distance for efficiency
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearest = { x: i, y: j };
                    }
                }
            }
        }
        return nearest;
    }

    render(ctx, cameraX, cameraY) {
        if (!this.grassTile || !this.grassTile.complete) return;

        ctx.save();
        
        // Calculate the drawing offset based on camera position
        // This translation effectively shifts the world according to the camera view
        ctx.translate(-cameraX, -cameraY);

        const ts = this.tileSize;
        
        // Calculate visible tile range in grid coordinates
        // cameraX/Y can be negative if the map is centered and smaller than viewport
        const startTileX = Math.floor(cameraX / ts);
        const endTileX = Math.ceil((cameraX + this.viewportWidth) / ts);
        const startTileY = Math.floor(cameraY / ts);
        const endTileY = Math.ceil((cameraY + this.viewportHeight) / ts);

        // Clamp tile indices to map boundaries (0 to width/height)
        const drawStartX = Math.max(0, startTileX);
        const drawEndX = Math.min(this.width, endTileX);
        const drawStartY = Math.max(0, startTileY);
        const drawEndY = Math.min(this.height, endTileY);

        // Iterate and draw grass tiles only for visible grid spots
        for (let i = drawStartX; i < drawEndX; i++) {
            for (let j = drawStartY; j < drawEndY; j++) {
                ctx.drawImage(
                    this.grassTile,
                    i * ts,
                    j * ts,
                    ts,
                    ts
                );
                
                // Check and draw obstacle/object
                const tileType = this.grid[j] ? this.grid[j][i] : TILE_TYPE.GRASS;
                let objectImage = null;

                switch(tileType) {
                    case TILE_TYPE.TREE: objectImage = this.treeTile; break;
                    case TILE_TYPE.LOGS: objectImage = this.logsTile; break;
                    case TILE_TYPE.BUSHES: objectImage = this.bushesTile; break;
                }
                
                if (objectImage && objectImage.complete) {
                     ctx.drawImage(
                        objectImage,
                        i * ts,
                        j * ts,
                        ts,
                        ts
                    );
                }
            }
        }

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // Subtle grid lines
        ctx.lineWidth = 1;

        // Draw visible vertical lines
        for (let i = drawStartX; i <= drawEndX; i++) {
            if (i > this.width) continue; 
            const x = i * ts;
            ctx.beginPath();
            ctx.moveTo(x, drawStartY * ts);
            ctx.lineTo(x, drawEndY * ts);
            ctx.stroke();
        }

        // Draw visible horizontal lines
        for (let j = drawStartY; j <= drawEndY; j++) {
            if (j > this.height) continue;
            const y = j * ts;
            ctx.beginPath();
            ctx.moveTo(drawStartX * ts, y);
            ctx.lineTo(drawEndX * ts, y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}