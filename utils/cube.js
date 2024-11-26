class Cube {
    constructor(config) {
        this.position = config.position;
        this.rotation = new Vector.Vec3(0, 0, 0);
        this.velocity = 0;
        this.gridX = config.gridX;
        this.gridZ = config.gridZ;
        this.settled = false;
        this.targetY = config.targetY;
        this.id = Date.now();
    }

    update() {
        if (!this.settled) {
            this.velocity += 0.5;
            this.position.y += this.velocity * 0.016;

            if (this.position.y >= this.targetY) {
                this.settle();
            }
        }
    }

    settle() {
        this.position.y = this.targetY;
        this.velocity = 0;
        this.settled = true;
        this.addRandomRotation();
    }

    addRandomRotation() {
        this.rotation.x = Math.random() * 0.1 - 0.05;
        this.rotation.y = Math.random() * 0.1 - 0.05;
        this.rotation.z = Math.random() * 0.1 - 0.05;
    }

    render(ctx) {
        const vertices = this.createVertices();
        const faces = this.createFaces();
        const transformed = this.transformVertices(vertices);
        const sortedFaces = this.sortFacesByDepth(faces, vertices);

        sortedFaces.forEach(face => {
            this.textureMapper.applyTextureToFace(face.verts, transformed, face.uvs);
            this.renderEdges(ctx, transformed, face.verts);
        });
    }

    createVertices() {
        return [
            new Vector.Vec3(-0.5, -0.5, -0.5),
            new Vector.Vec3(0.5, -0.5, -0.5),
            new Vector.Vec3(0.5, 0.5, -0.5),
            new Vector.Vec3(-0.5, 0.5, -0.5),
            new Vector.Vec3(-0.5, -0.5, 0.5),
            new Vector.Vec3(0.5, -0.5, 0.5),
            new Vector.Vec3(0.5, 0.5, 0.5),
            new Vector.Vec3(-0.5, 0.5, 0.5)
        ];
    }

    createFaces() {
        return [
            { verts: [0, 1, 2, 3], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] },
            { verts: [1, 5, 6, 2], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] },
            { verts: [5, 4, 7, 6], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] },
            { verts: [4, 0, 3, 7], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] },
            { verts: [3, 2, 6, 7], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] },
            { verts: [4, 5, 1, 0], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] }
        ];
    }

    transformVertices(vertices) {
        return vertices.map(v => {
            const rotated = v.clone();
            rotated.rotateX(this.rotation.x);
            rotated.rotateY(this.rotation.y);
            rotated.rotateZ(this.rotation.z);
            rotated.mul(2);
            rotated.add(this.position);

            const scale = 400 / (rotated.z + 15);
            return new Vector.Vec2(
                this.textureMapper.canvas.width/2 + rotated.x * scale,
                this.textureMapper.canvas.height/2 + rotated.y * scale
            );
        });
    }

    sortFacesByDepth(faces, vertices) {
        return [...faces].sort((a, b) => {
            const aZ = this.calculateFaceDepth(a, vertices);
            const bZ = this.calculateFaceDepth(b, vertices);
            return bZ - aZ;
        });
    }

    calculateFaceDepth(face, vertices) {
        return face.verts.reduce((sum, i) => sum + vertices[i].z, 0) / face.verts.length;
    }

    renderEdges(ctx, transformed, faceVerts) {
        ctx.beginPath();
        ctx.moveTo(transformed[faceVerts[0]].x, transformed[faceVerts[0]].y);
        for (let i = 1; i < faceVerts.length; i++) {
            ctx.lineTo(transformed[faceVerts[i]].x, transformed[faceVerts[i]].y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.stroke();
    }

    isColliding(otherCube) {
        const dx = Math.abs(this.position.x - otherCube.position.x);
        const dy = Math.abs(this.position.y - otherCube.position.y);
        const dz = Math.abs(this.position.z - otherCube.position.z);
        return dx < 2 && dy < 2 && dz < 2;
    }
}

// services/texture-mapper.js
class TextureMapper {
    constructor(canvas, textureImage) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.texture = textureImage;
        this.cubes = [];
        
        this.canvas.width = window.innerWidth - 40;
        this.canvas.height = window.innerHeight - 40;
        
        this.handleClick = this.handleClick.bind(this);
        this.animate = this.animate.bind(this);
        
        this.canvas.addEventListener('click', this.handleClick);
        this.animate();
    }

    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const TexturedCube = injectDeps(Cube);
        const cube = new TexturedCube({
            position: new Vector.Vec3(x/50 - 5, 0, y/50 - 5),
            gridX: Math.floor(x/50),
            gridZ: Math.floor(y/50),
            targetY: this.findStackHeight(x, y) * 2,
            textureMapper: this
        });
        
        this.cubes.push(cube);
    }

    findStackHeight(x, y) {
        const gridX = Math.floor(x/50);
        const gridZ = Math.floor(y/50);
        let maxHeight = 0;
        
        this.cubes.forEach(cube => {
            if (cube.gridX === gridX && cube.gridZ === gridZ) {
                maxHeight = Math.max(maxHeight, cube.position.y / 2 + 1);
            }
        });
        
        return maxHeight;
    }

    applyTextureToFace(faceVerts, transformed, uvs) {
        const ctx = this.ctx;
        
        // Create temporary canvas for texture transformation
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = 64;
        tempCanvas.height = 64;

        // Calculate transformation
        const srcPoints = uvs.map(uv => ({
            x: uv[0] * this.texture.width,
            y: uv[1] * this.texture.height
        }));
        const dstPoints = faceVerts.map(idx => transformed[idx]);
        
        const matrix = this.calculateTransformMatrix(srcPoints, dstPoints);

        // Apply transformation
        tempCtx.save();
        tempCtx.transform(
            matrix.a, matrix.b,
            matrix.c, matrix.d,
            matrix.e, matrix.f
        );
        tempCtx.drawImage(this.texture, 0, 0);
        tempCtx.restore();

        // Draw to main canvas
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(transformed[faceVerts[0]].x, transformed[faceVerts[0]].y);
        for (let i = 1; i < faceVerts.length; i++) {
            ctx.lineTo(transformed[faceVerts[i]].x, transformed[faceVerts[i]].y);
        }
        ctx.closePath();
        ctx.clip();
        
        const pattern = ctx.createPattern(tempCanvas, 'no-repeat');
        ctx.fillStyle = pattern;
        ctx.fill();
        ctx.restore();
    }

    calculateTransformMatrix(src, dst) {
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

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.cubes.forEach(cube => {
            cube.update();
            cube.render(this.ctx);
        });

        requestAnimationFrame(this.animate);
    }
}

