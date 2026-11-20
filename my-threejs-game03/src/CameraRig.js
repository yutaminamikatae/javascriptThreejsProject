import * as THREE from 'three';

export class CameraRig {
    constructor(camera, domElement = window) {
        this.camera = camera;
        this.domElement = domElement;

        // 視点プリセット（TPS と 広域俯瞰）
        this.presets = {
            tps: {
                distance: 13,
                yaw: 0,
                pitch: 0.68, // 上からの俯瞰角度（ラジアン）
                lookAtHeight: 1.0,
                lerpFactor: 0.14
            },
            overview: {
                distance: 26,
                yaw: 0,
                pitch: 0.9,
                lookAtHeight: 1.5,
                lerpFactor: 0.10
            }
        };

        this.mode = 'tps';
        this.targetDistance = this.presets.tps.distance;
        this.currentDistance = this.presets.tps.distance;

        this.targetYaw = this.presets.tps.yaw;
        this.currentYaw = this.presets.tps.yaw;

        this.targetPitch = this.presets.tps.pitch;
        this.currentPitch = this.presets.tps.pitch;

        this.lookAtHeight = this.presets.tps.lookAtHeight;
        this.lerpFactor = this.presets.tps.lerpFactor;

        this.currentLookAt = new THREE.Vector3(0, 1, 0);
        this.desiredPos = new THREE.Vector3();
        this.desiredLookAt = new THREE.Vector3();

        this._isDragging = false;
        this._lastX = 0;
        this._lastY = 0;

        this._bindEvents();
    }

    toggleMode() {
        this.setMode(this.mode === 'tps' ? 'overview' : 'tps');
        return this.mode;
    }

    setMode(nextMode) {
        const preset = this.presets[nextMode];
        if (!preset) return;

        this.mode = nextMode;
        this.targetDistance = preset.distance;
        this.targetPitch = preset.pitch;
        this.lookAtHeight = preset.lookAtHeight;
        this.lerpFactor = preset.lerpFactor;
    }

    rotate(deltaYaw, deltaPitch) {
        this.targetYaw += deltaYaw;
        // 真下（PI/2）や真横（0）に張り付かないよう制限
        this.targetPitch = THREE.MathUtils.clamp(this.targetPitch + deltaPitch, 0.25, 1.32);
    }

    zoom(deltaDistance) {
        this.targetDistance = THREE.MathUtils.clamp(this.targetDistance + deltaDistance, 8, 38);
    }

    _bindEvents() {
        const targetEl = this.domElement && this.domElement.addEventListener ? this.domElement : window;

        window.addEventListener('pointerdown', (e) => {
            // 右クリックまたは中クリック、あるいは左クリックドラッグで視点回転
            if (e.button === 0 || e.button === 2) {
                this._isDragging = true;
                this._lastX = e.clientX;
                this._lastY = e.clientY;
            }
        });

        window.addEventListener('pointermove', (e) => {
            if (!this._isDragging) return;
            const dx = e.clientX - this._lastX;
            const dy = e.clientY - this._lastY;
            this._lastX = e.clientX;
            this._lastY = e.clientY;

            this.rotate(-dx * 0.006, dy * 0.005);
        });

        window.addEventListener('pointerup', () => {
            this._isDragging = false;
        });

        targetEl.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoom(e.deltaY * 0.012);
        }, { passive: false });
    }

    update(player, keys = {}) {
        if (!player || !player.position || !this.camera) return;

        // キーボードでの視点回転・ズーム補助（Q/E で回転、Z/X でズーム）
        if (keys['KeyQ']) this.rotate(0.025, 0);
        if (keys['KeyE']) this.rotate(-0.025, 0);
        if (keys['KeyZ']) this.zoom(-0.4);
        if (keys['KeyX']) this.zoom(0.4);

        // 角度・距離を滑らかに補間
        this.currentDistance = THREE.MathUtils.lerp(this.currentDistance, this.targetDistance, 0.14);
        this.currentYaw = THREE.MathUtils.lerp(this.currentYaw, this.targetYaw, 0.16);
        this.currentPitch = THREE.MathUtils.lerp(this.currentPitch, this.targetPitch, 0.16);

        // 球面座標風のオフセット計算（+Z 手前基準、yaw で水平回転）
        const horizDist = Math.cos(this.currentPitch) * this.currentDistance;
        const vertDist = Math.sin(this.currentPitch) * this.currentDistance;

        const offsetX = Math.sin(this.currentYaw) * horizDist;
        const offsetZ = Math.cos(this.currentYaw) * horizDist;

        this.desiredPos.set(
            player.position.x + offsetX,
            player.position.y + vertDist,
            player.position.z + offsetZ
        );

        this.desiredLookAt.set(
            player.position.x,
            player.position.y + this.lookAtHeight,
            player.position.z
        );

        this.camera.position.lerp(this.desiredPos, this.lerpFactor);
        this.currentLookAt.lerp(this.desiredLookAt, 0.2);
        this.camera.lookAt(this.currentLookAt);
    }
}