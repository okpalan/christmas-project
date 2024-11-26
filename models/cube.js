class Cube {
    constructor(config) {
        this.position = config.position;
        this.rotation = new Vector.Vec3(0, 0, 0);
        this.velocity = new Vector.Vec3(0, 0, 0);
        this.angularVelocity = new Vector.Vec3(0, 0, 0);
        this.gridX = config.gridX;
        this.gridZ = config.gridZ;
        this.settled = false;
        this.targetY = config.targetY;
        this.id = Date.now();
        this.textureMapper = null;

        // Physics constants
        this.gravity = 9.81;
        this.restitution = 0.5; // Bounciness
        this.friction = 0.8;    // Surface friction
        this.airResistance = 0.99;
        this.rotationalDamping = 0.95;
        this.collisionThreshold = 0.1;
        this.settlementThreshold = 0.01;

        // Additional properties
        this.size = 2; // Cube size for collision
        this.mass = 1;
        this.clickable = true;
        this.selected = false;
    }

    update(deltaTime, otherCubes) {
        if (!this.settled) {
            this.applyPhysics(deltaTime);
            this.handleCollisions(otherCubes);
            this.updateRotation(deltaTime);
            this.checkSettlement();
        }
    }

    applyPhysics(deltaTime) {
        // Apply gravity
        this.velocity.y += this.gravity * deltaTime;

        // Apply air resistance
        this.velocity.mul(this.airResistance);

        // Update position
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
    }

    handleCollisions(otherCubes) {
        // Ground collision
        this.handleGroundCollision();

        // Boundary collisions (optional - keeps cubes in view)
        this.handleBoundaryCollisions();

        // Collisions with other cubes
        this.handleCubeCollisions(otherCubes);
    }

    handleGroundCollision() {
        if (this.position.y >= this.targetY) {
            this.position.y = this.targetY;

            // Normal force calculation
            const normalForce = new Vector.Vec3(0, -1, 0);
            const relativeVelocity = this.velocity.clone();
            const normalComponent = normalForce.mul(relativeVelocity.dot(normalForce));

            // Apply bounce with restitution
            if (Math.abs(this.velocity.y) > this.collisionThreshold) {
                this.velocity.y = -this.velocity.y * this.restitution;

                // Add random horizontal motion on impact
                this.velocity.x += (Math.random() - 0.5) * Math.abs(this.velocity.y) * 0.2;
                this.velocity.z += (Math.random() - 0.5) * Math.abs(this.velocity.y) * 0.2;

                // Add rotation on impact
                this.angularVelocity.x += (Math.random() - 0.5) * 0.1;
                this.angularVelocity.z += (Math.random() - 0.5) * 0.1;
            } else {
                // Apply friction when nearly stopped
                this.velocity.x *= this.friction;
                this.velocity.z *= this.friction;
            }
        }
    }

    handleBoundaryCollisions() {
        const bounds = 10;
        if (Math.abs(this.position.x) > bounds) {
            this.position.x = Math.sign(this.position.x) * bounds;
            this.velocity.x *= -this.restitution;
        }
        if (Math.abs(this.position.z) > bounds) {
            this.position.z = Math.sign(this.position.z) * bounds;
            this.velocity.z *= -this.restitution;
        }
    }

    handleCubeCollisions(otherCubes) {
        otherCubes.forEach(otherCube => {
            if (otherCube !== this) {
                const collision = this.checkCollision(otherCube);
                if (collision) {
                    this.resolveCollision(otherCube, collision);
                }
            }
        });
    }

    checkCollision(otherCube) {
        const dx = this.position.x - otherCube.position.x;
        const dy = this.position.y - otherCube.position.y;
        const dz = this.position.z - otherCube.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const minDist = this.size + otherCube.size;

        if (distance < minDist) {
            return {
                overlap: minDist - distance,
                normal: new Vector.Vec3(dx, dy, dz).normalize()
            };
        }
        return null;
    }

    resolveCollision(otherCube, collision) {
        // Move cubes apart
        const moveAmount = collision.overlap / 2;
        this.position.add(collision.normal.clone().mul(moveAmount));
        otherCube.position.sub(collision.normal.clone().mul(moveAmount));

        // Calculate relative velocity
        const relativeVel = this.velocity.clone().sub(otherCube.velocity);
        const velAlongNormal = relativeVel.dot(collision.normal);

        // Don't resolve if objects are moving apart
        if (velAlongNormal > 0) return;

        // Calculate restitution (bounciness)
        const restitution = 0.5;

        // Calculate impulse scalar
        const j = -(1 + restitution) * velAlongNormal;
        const impulse = collision.normal.clone().mul(j);

        // Apply impulse based on mass
        this.velocity.add(impulse.clone().mul(1 / this.mass));
        otherCube.velocity.sub(impulse.clone().mul(1 / otherCube.mass));

        // Add some random rotation on collision
        this.angularVelocity.add(new Vector.Vec3(
            Math.random() * 0.2 - 0.1,
            Math.random() * 0.2 - 0.1,
            Math.random() * 0.2 - 0.1
        ));
        otherCube.angularVelocity.add(new Vector.Vec3(
            Math.random() * 0.2 - 0.1,
            Math.random() * 0.2 - 0.1,
            Math.random() * 0.2 - 0.1
        ));

        // Unsettle both cubes
        this.settled = false;
        otherCube.settled = false;
    }

    updateRotation(deltaTime) {
        // Apply rotational velocity
        this.rotation.x += this.angularVelocity.x * deltaTime;
        this.rotation.y += this.angularVelocity.y * deltaTime;
        this.rotation.z += this.angularVelocity.z * deltaTime;

        // Dampen rotation
        this.angularVelocity.mul(this.rotationalDamping);
    }

    checkSettlement() {
        // Check if cube has essentially stopped moving
        const isSlowEnough = Math.abs(this.velocity.x) < this.settlementThreshold &&
            Math.abs(this.velocity.y) < this.settlementThreshold &&
            Math.abs(this.velocity.z) < this.settlementThreshold;
        const isNearTarget = Math.abs(this.position.y - this.targetY) < this.settlementThreshold;

        if (isSlowEnough && isNearTarget) {
            this.settle();
        }
    }

    settle() {
        this.settled = true;
        this.velocity = new Vector.Vec3(0, 0, 0);
        this.angularVelocity = new Vector.Vec3(0, 0, 0);
        this.position.y = this.targetY;

        // Add slight random rotation for visual interest
        this.rotation.x = Math.random() * 0.1 - 0.05;
        this.rotation.y = Math.random() * 0.1 - 0.05;
        this.rotation.z = Math.random() * 0.1 - 0.05;
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
            this.renderFace(ctx, face, transformed);
            this.renderEdges(ctx, transformed, face.verts);
        });
    }

    renderFace(ctx, face, transformed) {
        if (!this.textureMapper || !this.textureMapper.texture) {
            console.error('TextureMapper or texture not initialized');
            return;
        }

        ctx.save();

        // Create face path
        ctx.beginPath();
        ctx.moveTo(transformed[face.verts[0]].x, transformed[face.verts[0]].y);
        for (let i = 1; i < face.verts.length; i++) {
            ctx.lineTo(transformed[face.verts[i]].x, transformed[face.verts[i]].y);
        }
        ctx.closePath();

        // Apply the texture using TextureMapper
        const pattern = ctx.createPattern(this.textureMapper.texture, 'repeat');
        ctx.fillStyle = pattern;

        // Create texture coordinates for this face
        const texCoords = face.uvs.map(uv => ({
            x: uv[0] * this.textureMapper.texture.width,
            y: uv[1] * this.textureMapper.texture.height
        }));

        // Get the transformed coordinates
        const screenCoords = face.verts.map(index => transformed[index]);

        // Calculate transformation matrix
        const matrix = this.textureMapper.calculateTransformMatrix(
            texCoords.slice(0, 3), // First three points for transformation
            screenCoords.slice(0, 3)
        );

        // Apply transformation and fill
        ctx.save();
        ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
        ctx.fill();
        ctx.restore();

        ctx.restore();
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
                this.textureMapper.canvas.width / 2 + rotated.x * scale,
                this.textureMapper.canvas.height / 2 + rotated.y * scale
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

    isPointInside(x, y) {
        // Convert cube position to screen coordinates
        const screenPos = this.getScreenPosition();
        const halfSize = this.size * 20; // Adjust for screen scale

        return x >= screenPos.x - halfSize &&
            x <= screenPos.x + halfSize &&
            y >= screenPos.y - halfSize &&
            y <= screenPos.y + halfSize;
    }

    getScreenPosition() {
        // Project 3D position to 2D screen coordinates
        const scale = 400 / (this.position.z + 15);
        return {
            x: this.textureMapper.canvas.width / 2 + this.position.x * scale,
            y: this.textureMapper.canvas.height / 2 + this.position.y * scale
        };
    }

    handleClick() {
        if (!this.clickable) return;

        // Add impulse force when clicked
        this.velocity.add(new Vector.Vec3(
            (Math.random() - 0.5) * 5,
            -5,
            (Math.random() - 0.5) * 5
        ));

        this.settled = false;
        this.clickable = false;
        setTimeout(() => this.clickable = true, 1000); // Prevent rapid clicking
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
            { verts: [0, 1, 2, 3], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] }, // front
            { verts: [1, 5, 6, 2], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] }, // right
            { verts: [5, 4, 7, 6], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] }, // back
            { verts: [4, 0, 3, 7], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] }, // left
            { verts: [3, 2, 6, 7], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] }, // top
            { verts: [4, 5, 1, 0], uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] }  // bottom
        ];
    }

    isColliding(otherCube) {
        const dx = Math.abs(this.position.x - otherCube.position.x);
        const dy = Math.abs(this.position.y - otherCube.position.y);
        const dz = Math.abs(this.position.z - otherCube.position.z);
        return dx < 2 && dy < 2 && dz < 2;
    }
}
