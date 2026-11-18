import * as THREE from 'three';
import { pitData } from './mapData.js';

export function createPits(scene, textureLoader) {
    const pits = [];

    // 1. 床用のテクスチャ（地面と同じ ground.jpg）
    const floorTexture = textureLoader.load('./public/textures/ground.jpg');
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.colorSpace = THREE.SRGBColorSpace;

    const floorMaterial = new THREE.MeshBasicMaterial({ 
        map: floorTexture, 
        side: THREE.DoubleSide 
    });

    // 2. 側壁用のテクスチャ（wall.jpg）
    const wallTexture = textureLoader.load('./public/textures/wall.jpg');
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.colorSpace = THREE.SRGBColorSpace;

    const wallMaterial = new THREE.MeshBasicMaterial({ 
        map: wallTexture, 
        side: THREE.DoubleSide 
    });

    pitData.forEach(data => {
        const halfW = data.width / 2;
        const halfD = data.depth / 2;

        // 1. 一段低い「底面（床）」の生成
        const floorGeometry = new THREE.PlaneGeometry(data.width, data.depth);
        const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
        floorMesh.rotation.x = Math.PI / 2;
        floorMesh.position.set(data.positionX, -data.depthY, data.positionZ);
        scene.add(floorMesh);

        // 2. 穴の前後（北側・南側）の壁の生成
        // 北側の壁
        const wallNorth = createWallMesh(data.width, data.depthY, wallMaterial);
        wallNorth.position.set(data.positionX, -data.depthY / 2, data.positionZ - halfD);
        scene.add(wallNorth);

        // 南側の壁
        const wallSouth = createWallMesh(data.width, data.depthY, wallMaterial);
        wallSouth.position.set(data.positionX, -data.depthY / 2, data.positionZ + halfD);
        scene.add(wallSouth);

        // ※ 左右（東西）にあった不要な板（壁）は削除しました

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