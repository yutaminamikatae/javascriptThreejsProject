import * as THREE from 'three';

export function createWorld(scene) {
    // 背景色を設定
    scene.background = new THREE.Color(0x111111);

    // 地面（マップ）を作る
    const planeGeometry = new THREE.PlaneGeometry(20, 20); // 20×20の板
    const planeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x333333, 
        side: THREE.DoubleSide 
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = Math.PI / 2; // 水平にする
    scene.add(plane);
}