import * as THREE from 'three';
import { pitData } from './mapData.js';

export function createPits(scene, textureLoader) {
    const pits = [];

    // 穴の床と壁のテクスチャ（地面と同じか、少し濃い色のテクスチャ）
    const pitTexture = textureLoader.load('./public/textures/ground.jpg');
    pitTexture.wrapS = THREE.RepeatWrapping;
    pitTexture.wrapT = THREE.RepeatWrapping;
    pitTexture.colorSpace = THREE.SRGBColorSpace;

    const pitMaterial = new THREE.MeshBasicMaterial({ 
        map: pitTexture, 
        side: THREE.DoubleSide 
    });

    pitData.forEach(data => {
        const halfW = data.width / 2;
        const halfD = data.depth / 2;

        // 1. 一段低い「底面（床）」の生成
        const floorGeometry = new THREE.PlaneGeometry(data.width, data.depth);
        const floorMesh = new THREE.Mesh(floorGeometry, pitMaterial);
        floorMesh.rotation.x = Math.PI / 2;
        // 地面(Y=0)より depthY 分だけ下に配置
        floorMesh.position.set(data.positionX, -data.depthY, data.positionZ);
        scene.add(floorMesh);

        // 2. 穴の4周を囲む「壁（側壁）」の生成
        // 北側の壁
        const wallNorth = createWallMesh(data.width, data.depthY, pitMaterial);
        wallNorth.position.set(data.positionX, -data.depthY / 2, data.positionZ - halfD);
        scene.add(wallNorth);

        // 南側の壁
        const wallSouth = createWallMesh(data.width, data.depthY, pitMaterial);
        wallSouth.position.set(data.positionX, -data.depthY / 2, data.positionZ + halfD);
        scene.add(wallSouth);

        // 東側の壁
        const wallEast = createWallMesh(data.depthY, data.depth, pitMaterial);
        wallEast.rotation.y = Math.PI / 2;
        wallEast.position.set(data.positionX + halfW, -data.depthY / 2, data.positionZ);
        scene.add(wallEast);

        // 西側の壁
        const wallWest = createWallMesh(data.depthY, data.depth, pitMaterial);
        wallWest.rotation.y = Math.PI / 2;
        wallWest.position.set(data.positionX - halfW, -data.depthY / 2, data.positionZ);
        scene.add(wallWest);

        // 衝突判定や接地判定に使うデータをオブジェクトとして保持
        pits.push({
            data: data,
            floorY: -data.depthY,
            box: new THREE.Box3(
                new THREE.Vector3(data.positionX - halfW, -data.depthY, data.positionZ - halfD),
                new THREE.Vector3(data.positionX + halfW, 0, data.positionZ + halfD)
            )
        });
    });

    return pits;
}

// 壁（Plane）を作るヘルパー関数
function createWallMesh(width, height, material) {
    const geo = new THREE.PlaneGeometry(width, height);
    return new THREE.Mesh(geo, material);
}