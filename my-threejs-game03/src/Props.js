import * as THREE from 'three';

function createStreetLamp(data) {
    const group = new THREE.Group();
    const poleHeight = data.height ?? 3.4;

    const poleMat = new THREE.MeshBasicMaterial({ color: 0x2c3540 });
    const armMat = new THREE.MeshBasicMaterial({ color: 0x3b4654 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe89e });

    const baseGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.2, 10);
    const baseMesh = new THREE.Mesh(baseGeo, poleMat);
    baseMesh.position.y = 0.1;
    group.add(baseMesh);

    const poleGeo = new THREE.CylinderGeometry(0.07, 0.09, poleHeight, 10);
    const poleMesh = new THREE.Mesh(poleGeo, poleMat);
    poleMesh.position.y = poleHeight / 2;
    group.add(poleMesh);

    const armLength = 0.75;
    const armGeo = new THREE.BoxGeometry(armLength, 0.08, 0.08);
    const armMesh = new THREE.Mesh(armGeo, armMat);
    armMesh.position.set(armLength / 2 - 0.05, poleHeight - 0.08, 0);
    group.add(armMesh);

    const bulbGeo = new THREE.BoxGeometry(0.32, 0.12, 0.22);
    const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
    bulbMesh.position.set(armLength - 0.05, poleHeight - 0.16, 0);
    group.add(bulbMesh);

    group.position.set(data.x ?? 0, 0, data.z ?? 0);
    group.rotation.y = data.rotationY ?? 0;

    return group;
}

function createFence(data) {
    const group = new THREE.Group();
    const width = data.width ?? 4.0;
    const height = data.height ?? 0.9;
    const thickness = data.thickness ?? 0.14;

    const railMat = new THREE.MeshBasicMaterial({ color: 0x465466 });
    const postMat = new THREE.MeshBasicMaterial({ color: 0x2d3748 });

    const railGeo = new THREE.BoxGeometry(width, 0.08, thickness);
    const topRail = new THREE.Mesh(railGeo, railMat);
    topRail.position.y = height - 0.08;
    group.add(topRail);

    const midRail = new THREE.Mesh(railGeo, railMat);
    midRail.position.y = height * 0.5;
    group.add(midRail);

    const postCount = Math.max(2, Math.floor(width / 0.6) + 1);
    const postGeo = new THREE.BoxGeometry(0.07, height, thickness * 0.9);

    for (let i = 0; i < postCount; i++) {
        const t = postCount === 1 ? 0.5 : i / (postCount - 1);
        const px = -width / 2 + t * width;
        const postMesh = new THREE.Mesh(postGeo, postMat);
        postMesh.position.set(px, height / 2, 0);
        group.add(postMesh);
    }

    group.position.set(data.x ?? 0, 0, data.z ?? 0);
    group.rotation.y = data.rotationY ?? 0;

    return group;
}

function createBench(data) {
    const group = new THREE.Group();
    const width = data.width ?? 1.8;
    const seatHeight = data.seatHeight ?? 0.45;
    const depth = data.depth ?? 0.55;

    const woodMat = new THREE.MeshBasicMaterial({ color: data.seatColor ?? 0x9c6644 });
    const legMat = new THREE.MeshBasicMaterial({ color: data.legColor ?? 0x2b303a });

    // 座面
    const seatGeo = new THREE.BoxGeometry(width, 0.07, depth);
    const seatMesh = new THREE.Mesh(seatGeo, woodMat);
    seatMesh.position.y = seatHeight;
    group.add(seatMesh);

    // 背もたれ（奥側 Z = -depth/2 + 0.05 に少し傾けて配置）
    const backGeo = new THREE.BoxGeometry(width, 0.38, 0.06);
    const backMesh = new THREE.Mesh(backGeo, woodMat);
    backMesh.position.set(0, seatHeight + 0.22, -depth / 2 + 0.05);
    backMesh.rotation.x = -0.15;
    group.add(backMesh);

    // 左右の脚フレーム
    const legGeo = new THREE.BoxGeometry(0.08, seatHeight, depth * 0.85);
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-width / 2 + 0.14, seatHeight / 2, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(width / 2 - 0.14, seatHeight / 2, 0);
    group.add(rightLeg);

    group.position.set(data.x ?? 0, 0, data.z ?? 0);
    group.rotation.y = data.rotationY ?? 0;

    return group;
}

function createRoadSign(data) {
    const group = new THREE.Group();
    const poleHeight = data.height ?? 2.5;
    const variant = data.variant ?? 'circle'; // 'circle' | 'rect'

    const poleMat = new THREE.MeshBasicMaterial({ color: 0x9aa5b1 });
    const boardMat = new THREE.MeshBasicMaterial({
        color: data.boardColor ?? (variant === 'rect' ? 0x1d63b8 : 0xe63946)
    });
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

    // 支柱
    const poleGeo = new THREE.CylinderGeometry(0.045, 0.05, poleHeight, 10);
    const poleMesh = new THREE.Mesh(poleGeo, poleMat);
    poleMesh.position.y = poleHeight / 2;
    group.add(poleMesh);

    if (variant === 'rect') {
        // 案内標識・看板風の角板
        const boardGeo = new THREE.BoxGeometry(0.9, 0.45, 0.06);
        const boardMesh = new THREE.Mesh(boardGeo, boardMat);
        boardMesh.position.set(0, poleHeight - 0.25, 0.04);
        group.add(boardMesh);
    } else {
        // 標識風の円形プレート
        const plateGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.05, 20);
        const plateMesh = new THREE.Mesh(plateGeo, boardMat);
        plateMesh.rotation.x = Math.PI / 2;
        plateMesh.position.set(0, poleHeight - 0.2, 0.035);
        group.add(plateMesh);

        const innerGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.055, 20);
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        innerMesh.rotation.x = Math.PI / 2;
        innerMesh.position.set(0, poleHeight - 0.2, 0.036);
        group.add(innerMesh);
    }

    group.position.set(data.x ?? 0, 0, data.z ?? 0);
    group.rotation.y = data.rotationY ?? 0;

    return group;
}

function createPlanter(data) {
    const group = new THREE.Group();
    const width = data.width ?? 1.4;
    const depth = data.depth ?? 1.0;
    const potHeight = data.potHeight ?? 0.55;

    const potMat = new THREE.MeshBasicMaterial({ color: data.potColor ?? 0x5c6773 });
    const soilMat = new THREE.MeshBasicMaterial({ color: 0x3b2818 });
    const leafMat1 = new THREE.MeshBasicMaterial({ color: 0x2d6a4f });
    const leafMat2 = new THREE.MeshBasicMaterial({ color: 0x40916c });

    const wallThickness = 0.08;
    const bottomGeo = new THREE.BoxGeometry(width, 0.08, depth);
    const bottomMesh = new THREE.Mesh(bottomGeo, potMat);
    bottomMesh.position.y = 0.04;
    group.add(bottomMesh);

    const sideXGeo = new THREE.BoxGeometry(width, potHeight, wallThickness);
    const frontWall = new THREE.Mesh(sideXGeo, potMat);
    frontWall.position.set(0, potHeight / 2, depth / 2 - wallThickness / 2);
    group.add(frontWall);

    const backWall = new THREE.Mesh(sideXGeo, potMat);
    backWall.position.set(0, potHeight / 2, -depth / 2 + wallThickness / 2);
    group.add(backWall);

    const sideZGeo = new THREE.BoxGeometry(wallThickness, potHeight, depth - wallThickness * 2);
    const leftWall = new THREE.Mesh(sideZGeo, potMat);
    leftWall.position.set(-width / 2 + wallThickness / 2, potHeight / 2, 0);
    group.add(leftWall);

    const rightWall = new THREE.Mesh(sideZGeo, potMat);
    rightWall.position.set(width / 2 - wallThickness / 2, potHeight / 2, 0);
    group.add(rightWall);

    const soilGeo = new THREE.BoxGeometry(width - wallThickness * 2, 0.06, depth - wallThickness * 2);
    const soilMesh = new THREE.Mesh(soilGeo, soilMat);
    soilMesh.position.y = potHeight - 0.08;
    group.add(soilMesh);

    const shrub1 = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), leafMat1);
    shrub1.position.set(-width * 0.2, potHeight + 0.05, 0);
    group.add(shrub1);

    const shrub2 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), leafMat2);
    shrub2.position.set(width * 0.2, potHeight + 0.03, 0.05);
    group.add(shrub2);

    group.position.set(data.x ?? 0, 0, data.z ?? 0);
    group.rotation.y = data.rotationY ?? 0;

    return group;
}

const PROP_BUILDERS = {
    lamp: createStreetLamp,
    fence: createFence,
    bench: createBench,
    sign: createRoadSign,
    planter: createPlanter
};

export function createProps(scene, propData, options = {}) {
    const parentGroup = new THREE.Group();
    parentGroup.name = 'PropsGroup';
    parentGroup.visible = options.visible ?? true;

    const items = [];
    if (Array.isArray(propData)) {
        propData.forEach(data => {
            if (!data || !data.type) return;
            const builder = PROP_BUILDERS[data.type];
            if (!builder) return;

            const obj = builder(data);
            if (obj) {
                parentGroup.add(obj);
                items.push(obj);
            }
        });
    }

    if (scene) {
        scene.add(parentGroup);
    }

    return {
        group: parentGroup,
        items,
        setVisible(visible) {
            parentGroup.visible = Boolean(visible);
        },
        toggleVisible() {
            parentGroup.visible = !parentGroup.visible;
            return parentGroup.visible;
        },
        get isVisible() {
            return parentGroup.visible;
        }
    };
}