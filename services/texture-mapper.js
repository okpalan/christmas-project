class TextureMapper {
    constructor(canvas, textureImage) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.texture = textureImage;
        this.cubes = [];
        this.gridSize = 1; // Size of each grid cell for stacking
        this.gridCells = {}; // Track occupied grid positions
        
        // Set canvas dimensions
        this.canvas.width = window.innerWidth - 40;
        this.canvas.height = window.innerHeight - 40;
        
        // Bind methods
        this.handleClick = this.handleClick.bind(this);
        this.animate = this.animate.bind(this);
        
        // Initialize event listeners
        this.canvas.addEventListener('click', this.handleClick);
        
        // Start animation loop
        this.animate();
    }

    getGridPosition(x, y) {
        // Convert screen coordinates to grid coordinates
        const gridX = Math.floor(x / (this.canvas.width * 0.1));
        const gridZ = Math.floor(y / (this.canvas.height * 0.1));
        return { gridX, gridZ };
    }

    findStackHeight(gridX, gridZ) {
        const key = `${gridX},${gridZ}`;
        return this.gridCells[key] || 0;
    }

    createCube(x, y) {
        const { gridX, gridZ } = this.getGridPosition(x, y);
        const height = this.findStackHeight(gridX, gridZ);
        
        // Update grid height
        const key = `${gridX},${gridZ}`;
        this.gridCells[key] = height + 1;

        return {
            position: new Vector.Vec3(
                gridX * this.gridSize - 5, 
                -height * 2, // Start above current stack
                gridZ * this.gridSize - 5
            ),
            rotation: new Vector.Vec3(0, 0, 0),
            velocity: 0,
            gridX: gridX,
            gridZ: gridZ,
            settled: false,
            targetY: height * 2 // Target Y position for stacking
        };
    }

    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        this.cubes.push(this.createCube(x, y));
    }

    applyTextureToFace(face, transformed, uvs) {
        const ctx = this.ctx;
        
        // Create temporary canvas for texture transformation
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = 64;
        tempCanvas.height = 64;

        // Define the corners of the face in both source and destination space
        const srcPoints = uvs.map(uv => ({ x: uv[0] * this.texture.width, y: uv[1] * this.texture.height }));
        const dstPoints = face.map(idx => transformed[idx]);

        // Calculate transformation matrix
        const matrix = this.calculateTransformMatrix(srcPoints, dstPoints);

        // Apply transformation and draw texture
        tempCtx.save();
        tempCtx.transform(
            matrix.a, matrix.b,
            matrix.c, matrix.d,
            matrix.e, matrix.f
        );
        tempCtx.drawImage(this.texture, 0, 0);
        tempCtx.restore();

        // Draw transformed texture onto main canvas
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(transformed[face[0]].x, transformed[face[0]].y);
        for (let i = 1; i < face.length; i++) {
            ctx.lineTo(transformed[face[i]].x, transformed[face[i]].y);
        }
        ctx.closePath();
        ctx.clip();
        
        const pattern = ctx.createPattern(tempCanvas, 'no-repeat');
        ctx.fillStyle = pattern;
        ctx.fill();
        ctx.restore();
    }

    calculateTransformMatrix(src, dst) {
        // Calculate perspective transform matrix
        // This is a simplified version - you might want to use a proper matrix library
        const dx1 = src[1].x - src[0].x;
        const dy1 = src[1].y - src[0].y;
        const dx2 = src[2].x - src[0].x;
        const dy2 = src[2].y - src[0].y;
        
        const dx3 = dst[1].x - dst[0].x;
        const dy3 = dst[1].y - dst[0].y;
        const dx4 = dst[2].x - dst[0].x;
        const dy4 = dst[2].y - dst[0].y;

        return {
            a: dx3 / dx1,
            b: dy3 / dx1,
            c: dx4 / dy2,
            d: dy4 / dy2,
            e: dst[0].x - (dx3 * src[0].x) / dx1,
            f: dst[0].y - (dy3 * src[0].x) / dx1
        };
    }

    renderCube(cube) {
        const vertices = [
            new Vector.Vec3(-0.5, -0.5, -0.5),
            new Vector.Vec3(0.5, -0.5, -0.5),
            new Vector.Vec3(0.5, 0.5, -0.5),
            new Vector.Vec3(-0.5, 0.5, -0.5),
            new Vector.Vec3(-0.5, -0.5, 0.5),
            new Vector.Vec3(0.5, -0.5, 0.5),
            new Vector.Vec3(0.5, 0.5, 0.5),
            new Vector.Vec3(-0.5, 0.5, 0.5)
        ];

        const faces = [
            { verts: [0, 1, 2, 3], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] },
            { verts: [1, 5, 6, 2], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] },
            { verts: [5, 4, 7, 6], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] },
            { verts: [4, 0, 3, 7], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] },
            { verts: [3, 2, 6, 7], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] },
            { verts: [4, 5, 1, 0], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] }
        ];

        // Transform vertices
        const transformed = vertices.map(v => {
            const rotated = v.clone();
            rotated.rotateX(cube.rotation.x);
            rotated.rotateY(cube.rotation.y);
            rotated.rotateZ(cube.rotation.z);
            rotated.mul(2); // Scale cube
            rotated.add(cube.position);

            // Apply perspective projection
            const scale = 400 / (rotated.z + 15);
            return new Vector.Vec2(
                this.canvas.width/2 + rotated.x * scale,
                this.canvas.height/2 + rotated.y * scale
            );
        });

        // Sort faces by depth
        const sortedFaces = [...faces].sort((a, b) => {
            const aZ = a.verts.reduce((sum, i) => sum + vertices[i].z, 0) / 4;
            const bZ = b.verts.reduce((sum, i) => sum + vertices[i].z, 0) / 4;
            return bZ - aZ;
        });

        // Render faces with proper texture mapping
        sortedFaces.forEach(face => {
            this.applyTextureToFace(face.verts, transformed, face.uvs);
            
            // Draw edges
            this.ctx.beginPath();
            this.ctx.moveTo(transformed[face.verts[0]].x, transformed[face.verts[0]].y);
            for (let i = 1; i < face.verts.length; i++) {
                this.ctx.lineTo(transformed[face.verts[i]].x, transformed[face.verts[i]].y);
            }
            this.ctx.closePath();
            this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            this.ctx.stroke();
        });
    }

    updatePhysics(cube) {
        if (!cube.settled) {
            // Move towards target position
            cube.velocity += 0.5;
            cube.position.y += cube.velocity * 0.016;

            // Check for collision with target position or other cubes
            if (cube.position.y >= cube.targetY) {
                cube.position.y = cube.targetY;
                cube.velocity = 0;
                cube.settled = true;

                // Slight random rotation for visual interest
                cube.rotation.x = Math.random() * 0.1 - 0.05;
                cube.rotation.y = Math.random() * 0.1 - 0.05;
                cube.rotation.z = Math.random() * 0.1 - 0.05;
            }
        }
    }

    animate() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and render cubes
        this.cubes.forEach(cube => {
            this.updatePhysics(cube);
            this.renderCube(cube);
        });

        requestAnimationFrame(this.animate);
    }
}
