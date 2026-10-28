import * as THREE from 'three';

export function createWorld(scene) {
    scene.background = new THREE.Color(0x111111);

    // 広い地面を作る
    const planeGeometry = new THREE.PlaneGeometry(30, 30);
    const planeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x333333, 
        side: THREE.DoubleSide 
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = Math.PI / 2;
    scene.add(plane);

    const buildings = [];

    // 建物データ [幅, 高さ, 奥行き, X位置, Z位置, 色]
    const buildingData = [
        { w: 4, h: 1.5, d: 4, x: 0, z: -6, color: 0x9a8c98 }, // ★ジャンプして飛び乗れる低い台座
        { w: 4, h: 3, d: 4, x: -6, z: -5, color: 0x4a4e69 }, // 低いビル
        { w: 3, h: 6, d: 3, x: 6, z: -6, color: 0x22223b },  // 高いビル
        { w: 3, h: 4, d: 3, x: -6, z: 6, color: 0x3a0ca3 }   // 青紫の建物
    ];

    buildingData.forEach(data => {
        const geometry = new THREE.BoxGeometry(data.w, data.h, data.d);
        const material = new THREE.MeshBasicMaterial({ color: data.color });
        const mesh = new THREE.Mesh(geometry, material);
        
        const meshY = data.h / 2;
        mesh.position.set(data.x, meshY, data.z);
        scene.add(mesh);

        // 衝突判定用ボックスと、屋根の高さ（h）を記憶させる
        mesh.box3 = new THREE.Box3().setFromObject(mesh);
        mesh.topY = data.h; // 建物の天ペンの高さ
        buildings.push(mesh);
    });

    return buildings;
}