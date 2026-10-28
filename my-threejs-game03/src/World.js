import * as THREE from 'three';
import { buildingData } from './mapData.js';
import { createTrain } from './Train.js'; // ★電車モジュールをインポート

export function createWorld(scene) {
    scene.background = new THREE.Color(0x111111);

    const textureLoader = new THREE.TextureLoader();

    // 地面の作成
    const groundTexture = textureLoader.load('./public/textures/ground.jpg');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(8, 8);
    groundTexture.colorSpace = THREE.SRGBColorSpace;

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 30),
        new THREE.MeshBasicMaterial({ map: groundTexture, side: THREE.DoubleSide })
    );
    plane.rotation.x = Math.PI / 2;
    scene.add(plane);

    // 建物の作成
    const buildings = [];
    const wallTexture = textureLoader.load('./public/textures/wall.jpg');
    wallTexture.colorSpace = THREE.SRGBColorSpace;

    buildingData.forEach(data => {
        const geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);
        const material = new THREE.MeshBasicMaterial({ map: wallTexture });
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.set(data.positionX, data.height / 2, data.positionZ);
        scene.add(mesh);

        mesh.box3 = new THREE.Box3().setFromObject(mesh);
        mesh.topY = data.height;
        buildings.push(mesh);
    });

    // ★ 外部化した Train.js から電車を作成
    const train = createTrain(scene);

    // main.js で使うために建物の配列と電車を返却
    return { buildings, train };
}