import * as THREE from 'three';

export const TRAIN_POS_Z = -10;
export const TRAIN_START_X = -13;
export const TRAIN_END_X = 52;
export const TRAIN_SPEED_X = 0.12;

const TRAIN_TEXTURES = {
    floor: './public/textures/train_floor.png',
    leftWall: './public/textures/train_left.png',
    backWall: './public/textures/train_back.png',
    roof: './public/textures/train_roof.png',
    fallback: './public/textures/wall.jpg'
};

function createPartMaterial(textureLoader, path, fallbackPath) {
    const material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide
    });

    const texture = textureLoader.load(
        path,
        undefined,
        undefined,
        () => {
            const fallbackTex = textureLoader.load(fallbackPath);
            fallbackTex.colorSpace = THREE.SRGBColorSpace;
            material.map = fallbackTex;
            material.needsUpdate = true;
        }
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    material.map = texture;

    return material;
}

export function createTrain(scene) {
    // 進行方向（+X）に合わせて車体長（X方向=8、Z方向=4）に調整
    const width = 8;
    const height = 3.5;
    const depth = 4;

    const textureLoader = new THREE.TextureLoader();
    const trainGroup = new THREE.Group();

    // 床面
    const floorMat = createPartMaterial(textureLoader, TRAIN_TEXTURES.floor, TRAIN_TEXTURES.fallback);
    const floorGeo = new THREE.PlaneGeometry(width, depth);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0.05;
    trainGroup.add(floorMesh);

    // 側面（奥側 Z = -depth/2）
    const backMat = createPartMaterial(textureLoader, TRAIN_TEXTURES.backWall, TRAIN_TEXTURES.fallback);
    const backGeo = new THREE.PlaneGeometry(width, height);
    const backWall = new THREE.Mesh(backGeo, backMat);
    backWall.position.set(0, height / 2, -depth / 2);
    trainGroup.add(backWall);

    // 背面（西側 X = -width/2）
    const leftMat = createPartMaterial(textureLoader, TRAIN_TEXTURES.leftWall, TRAIN_TEXTURES.fallback);
    const sideGeo = new THREE.PlaneGeometry(depth, height);
    const leftWall = new THREE.Mesh(sideGeo, leftMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-width / 2, height / 2, 0);
    trainGroup.add(leftWall);

    // 屋根
    const roofMat = createPartMaterial(textureLoader, TRAIN_TEXTURES.roof, TRAIN_TEXTURES.fallback);
    const roofGeo = new THREE.PlaneGeometry(width, depth);
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.rotation.x = Math.PI / 2;
    roofMesh.position.y = height;
    trainGroup.add(roofMesh);

    if (scene) {
        scene.add(trainGroup);
    }

    // 西側 7・8・9 に面する Z = -10 の左端（X = -13）からスタート
    trainGroup.position.set(TRAIN_START_X, 0, TRAIN_POS_Z);
    trainGroup.prevX = trainGroup.position.x;
    trainGroup.prevZ = trainGroup.position.z;

    return trainGroup;
}

export function updateTrain(train) {
    if (!train || !train.position) return;

    train.prevX = train.position.x;
    train.prevZ = train.position.z;

    train.position.z = TRAIN_POS_Z;
    train.position.x += TRAIN_SPEED_X;

    // 東側エリアの端（TRAIN_END_X）を超えたら西側スタート位置（TRAIN_START_X）へループ
    if (train.position.x > TRAIN_END_X) {
        train.position.x = TRAIN_START_X;
    }
}