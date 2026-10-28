import * as THREE from 'three';

export function createWorld(scene) {
    scene.background = new THREE.Color(0x111111);

    const textureLoader = new THREE.TextureLoader();

    // 地面のテクスチャ読み込み
    // ※画像が見つからない時のために、基本色(color)も設定しておきます
    const groundTexture = textureLoader.load('./public/textures/ground.jpg');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(8, 8);
    groundTexture.colorSpace = THREE.SRGBColorSpace;

    const planeGeometry = new THREE.PlaneGeometry(30, 30);
    const planeMaterial = new THREE.MeshBasicMaterial({ 
        map: groundTexture,
        side: THREE.DoubleSide 
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = Math.PI / 2;
    scene.add(plane);

    const buildings = [];

    // 建物のテクスチャ読み込み
    const wallTexture = textureLoader.load('./public/textures/wall.jpg');
    wallTexture.colorSpace = THREE.SRGBColorSpace;

    const buildingData = [
        { w: 4, h: 1.5, d: 4, x: 0, z: -6 },
        { w: 4, h: 3, d: 4, x: -6, z: -5 },
        { w: 3, h: 6, d: 3, x: 6, z: -6 },
        { w: 3, h: 4, d: 3, x: -6, z: 6 }
    ];

    buildingData.forEach(data => {
        const geometry = new THREE.BoxGeometry(data.w, data.h, data.d);
        const material = new THREE.MeshBasicMaterial({ map: wallTexture });
        const mesh = new THREE.Mesh(geometry, material);
        
        const meshY = data.h / 2;
        mesh.position.set(data.x, meshY, data.z);
        scene.add(mesh);

        mesh.box3 = new THREE.Box3().setFromObject(mesh);
        mesh.topY = data.h;
        buildings.push(mesh);
    });

    return buildings;
}