import * as THREE from 'three';
import { waterData } from './mapData.js';

export function createWater(scene) {
    const waters = [];

    // 水の見た目の設定（半透明の青色）
    const waterMaterial = new THREE.MeshBasicMaterial({
        color: 0x00aaff,      // 水色
        transparent: true,    // 透明化を有効にする
        opacity: 0.6,         // 透け具合（0が完全透明、1が不透明）
        side: THREE.DoubleSide
    });

    waterData.forEach(data => {
        const geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);
        const waterMesh = new THREE.Mesh(geometry, waterMaterial);
        
        // 水面の位置を設定（少しだけ地面から浮かせる、または埋め込む）
        waterMesh.position.set(data.positionX, data.height / 2, data.positionZ);
        scene.add(waterMesh);

        waters.push(waterMesh);
    });

    return waters;
}