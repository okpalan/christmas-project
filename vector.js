var Vector;
(function (Vector) {
    "use strict";
    
    var Vec2 = function (x, y) {
        this.x = x;
        this.y = y;
    };

    Object.defineProperty(Vec2, "I", {
        get: function () {
            return new Vec2(1, 0);
        }
    });

    Object.defineProperty(Vec2, "J", {
        get: function () {
            return new Vec2(0, 1);
        }
    });

    Vec2.prototype.add = function (v) {
        if (v instanceof Vec2) {
            this.x += v.x;
            this.y += v.y;
        } else {
            this.x += v;
            this.y += v;
        }
        return this;
    };

    Vec2.prototype.sub = function (v) {
        if (v instanceof Vec2) {
            this.x -= v.x;
            this.y -= v.y;
        } else {
            this.x -= v;
            this.y -= v;
        }
        return this;
    };

    Vec2.prototype.mul = function (v) {
        if (v instanceof Vec2) {
            this.x *= v.x;
            this.y *= v.y;
        } else {
            this.x *= v;
            this.y *= v;
        }
        return this;
    };

    Vec2.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y;
    };

    Vec2.prototype.cross = function (v) {
        return this.x * v.y - this.y * v.x;
    };

    Vec2.prototype.normalize = function () {
        var len = this.length();
        if (len !== 0) {
            this.x /= len;
            this.y /= len;
        }
        return this;
    };

    Vec2.prototype.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };

    Vec2.prototype.distance = function (v) {
        var dx = this.x - v.x;
        var dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    };

    Vec2.prototype.clone = function () {
        return new Vec2(this.x, this.y);
    };

    Vec2.prototype.toString = function () {
        return "Vector.Vec2 <" + this.x + ", " + this.y + ">";
    };

    Vec2.prototype.toArray = function () {
        return [this.x, this.y];
    };

    Vector["Vec2"] = Vec2;

    var Vec3 = function (x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    };

    Object.defineProperty(Vec3, "I", {
        get: function () {
            return new Vec3(1, 0, 0);
        }
    });

    Object.defineProperty(Vec3, "J", {
        get: function () {
            return new Vec3(0, 1, 0);
        }
    });

    Object.defineProperty(Vec3, "K", {
        get: function () {
            return new Vec3(0, 0, 1);
        }
    });

    Vec3.prototype.add = function (v) {
        if (v instanceof Vec3) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
        } else {
            this.x += v;
            this.y += v;
            this.z += v;
        }
        return this;
    };

    Vec3.prototype.sub = function (v) {
        if (v instanceof Vec3) {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
        } else {
            this.x -= v;
            this.y -= v;
            this.z -= v;
        }
        return this;
    };

    Vec3.prototype.mul = function (v) {
        if (v instanceof Vec3) {
            this.x *= v.x;
            this.y *= v.y;
            this.z *= v.z;
        } else {
            this.x *= v;
            this.y *= v;
            this.z *= v;
        }
        return this;
    };

    Vec3.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    };

    Vec3.prototype.cross = function (v) {
        const x = this.y * v.z - this.z * v.y;
        const y = this.z * v.x - this.x * v.z;
        const z = this.x * v.y - this.y * v.x;
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    };

    Vec3.prototype.normalize = function () {
        var len = this.length();
        if (len !== 0) {
            this.x /= len;
            this.y /= len;
            this.z /= len;
        }
        return this;
    };

    Vec3.prototype.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    };

    Vec3.prototype.project = function (v) {
        const dot = this.dot(v);
        const len2 = v.dot(v);
        return v.clone().mul(dot / len2);
    };

    Vec3.prototype.reflect = function (normal) {
        const dot = this.dot(normal);
        return this.sub(normal.clone().mul(2 * dot));
    };

    Vec3.prototype.rotateX = function (angle) {
        const y = this.y;
        const z = this.z;
        this.y = y * Math.cos(angle) - z * Math.sin(angle);
        this.z = z * Math.cos(angle) + y * Math.sin(angle);
        return this;
    };

    Vec3.prototype.rotateY = function (angle) {
        const x = this.x;
        const z = this.z;
        this.x = x * Math.cos(angle) + z * Math.sin(angle);
        this.z = z * Math.cos(angle) - x * Math.sin(angle);
        return this;
    };

    Vec3.prototype.rotateZ = function (angle) {
        const x = this.x;
        const y = this.y;
        this.x = x * Math.cos(angle) - y * Math.sin(angle);
        this.y = y * Math.cos(angle) + x * Math.sin(angle);
        return this;
    };

    Vec3.prototype.distance = function (v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        const dz = this.z - v.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    };

    Vec3.prototype.clone = function () {
        return new Vec3(this.x, this.y, this.z);
    };

    Vec3.prototype.toString = function () {
        return "Vector.Vec3 <" + this.x + ", " + this.y + ", " + this.z + ">";
    };

    Vec3.prototype.toArray = function () {
        return [this.x, this.y, this.z];
    };

    Vector["Vec3"] = Vec3;
})(typeof Vector === "undefined" ? (Vector = {}) : Vector);