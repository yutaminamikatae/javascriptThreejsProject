import * as THREE from 'three';
import { buildingData, pitData } from './mapData.js'; // ★ pitData も読み込む
import { createTrain } from './Train.js';
import { createWater } from './Water.js';
import { createPits } from './Pit.js';

export function createWorld(scene) {
    scene.background = new THREE.Color(0x111111);

    const textureLoader = new THREE.TextureLoader();

    // 1. 地面（ベース）の作成：★ pitData の位置をくり抜く
    const groundTexture = textureLoader.load('./public/textures/ground.jpg');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    // ShapeGeometry の UV 座標スケールに合わせてリピートを調整
    groundTexture.repeat.set(0.25, 0.25); 
    groundTexture.colorSpace = THREE.SRGBColorSpace;

    // 30x30 の正方形の輪郭を定義
    const groundShape = new THREE.Shape();
    groundShape.moveTo(-15, -15);
    groundShape.lineTo(15, -15);
    groundShape.lineTo(15, 15);
    groundShape.lineTo(-15, 15);
    groundShape.closePath();

    // pitData に定義された穴を地面からくり抜く
    pitData.forEach(pit => {
        const halfW = pit.width / 2;
        const halfD = pit.depth / 2;
        const hole = new THREE.Path();
        
        // X軸回転(-Math.PI / 2)でXZ平面に倒すため、Shape上のY座標は「-Z」に対応する
        const x = pit.positionX;
        const y = -pit.positionZ;

        hole.moveTo(x - halfW, y - halfD);
        hole.lineTo(x + halfW, y - halfD);
        hole.lineTo(x + halfW, y + halfD);
        hole.lineTo(x - halfW, y + halfD);
        hole.closePath();

        groundShape.holes.push(hole);
    });

    const groundGeometry = new THREE.ShapeGeometry(groundShape);
    const plane = new THREE.Mesh(
        groundGeometry,
        new THREE.MeshBasicMaterial({ map: groundTexture, side: THREE.DoubleSide })
    );
    plane.rotation.x = -Math.PI / 2; // 水平に寝かせる
    scene.add(plane);

    // 2. 建物（障害物）の作成
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

    // 3. 各モジュール（電車、水、一段低い空間）の生成
    const train = createTrain(scene);
    const waters = createWater(scene);
    const pits = createPits(scene, textureLoader);

    return { buildings, train, waters, pits };
}