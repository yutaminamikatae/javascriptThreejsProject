import * as THREE from 'three';
import { pitData } from './mapData.js';

export function createPits(scene, textureLoader, pitData) {
    const pits = [];
    if (!Array.isArray(pitData) || pitData.length === 0) return pits;

    const loader = textureLoader || new THREE.TextureLoader();

    const floorTex = loader.load('./public/textures/pit_floor.jpg', undefined, undefined, () => {
        floorTex.colorSpace = THREE.SRGBColorSpace;
    });
    floorTex.colorSpace = THREE.SRGBColorSpace;

    const wallTex = loader.load('./public/textures/pit_wall.jpg', undefined, undefined, () => {
        wallTex.colorSpace = THREE.SRGBColorSpace;
    });
    wallTex.colorSpace = THREE.SRGBColorSpace;

    const floorMat = new THREE.MeshBasicMaterial({ map: floorTex, side: THREE.DoubleSide });
    const wallMat = new THREE.MeshBasicMaterial({ map: wallTex, side: THREE.DoubleSide });

    pitData.forEach(data => {
        if (!data || (data.heightY ?? 0) > 0) return;

        const width = data.width ?? 6;
        const depth = data.depth ?? 5;
        const depthY = Math.abs(data.depthY ?? 1.5);
        const cx = data.positionX ?? 0;
        const cz = data.positionZ ?? 0;

        const pitGroup = new THREE.Group();
        pitGroup.position.set(cx, 0, cz);

        // 窪みの底面（1段下なら -1.5、2段下なら -3.0 など depthY に応じた深さ）
        const floorGeo = new THREE.PlaneGeometry(width, depth);
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.y = -depthY;
        pitGroup.add(floorMesh);

        // 内側の4方の壁面
        const wallZGeo = new THREE.PlaneGeometry(width, depthY);
        const northWall = new THREE.Mesh(wallZGeo, wallMat);
        northWall.position.set(0, -depthY / 2, -depth / 2);
        pitGroup.add(northWall);

        const southWall = new THREE.Mesh(wallZGeo, wallMat);
        southWall.rotation.y = Math.PI;
        southWall.position.set(0, -depthY / 2, depth / 2);
        pitGroup.add(southWall);

        const wallXGeo = new THREE.PlaneGeometry(depth, depthY);
        const westWall = new THREE.Mesh(wallXGeo, wallMat);
        westWall.rotation.y = Math.PI / 2;
        westWall.position.set(-width / 2, -depthY / 2, 0);
        pitGroup.add(westWall);

        const eastWall = new THREE.Mesh(wallXGeo, wallMat);
        eastWall.rotation.y = -Math.PI / 2;
        eastWall.position.set(width / 2, -depthY / 2, 0);
        pitGroup.add(eastWall);

        if (scene) {
            scene.add(pitGroup);
        }

        pits.push({
            ...data,
            group: pitGroup
        });
    });

    return pits;
}

// 壁（Plane）を作るヘルパー関数
function createWallMesh(width, height, material) {
    const geo = new THREE.PlaneGeometry(width, height);
    return new THREE.Mesh(geo, material);
}