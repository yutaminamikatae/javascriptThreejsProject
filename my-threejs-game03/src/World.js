import * as THREE from 'three';
import { buildingData, pitData } from './mapData.js';
import { createTrain } from './Train.js';
import { createWater } from './Water.js';
import { createPits } from './Pit.js';

export function createWorld(scene) {
    scene.background = new THREE.Color(0x111111);

    const textureLoader = new THREE.TextureLoader();

    // 1. 地面（ベース）の作成：pitData の位置をくり抜く
    const groundTexture = textureLoader.load('./public/textures/ground.jpg');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(0.25, 0.25); 
    groundTexture.colorSpace = THREE.SRGBColorSpace;

    const groundShape = new THREE.Shape();
    groundShape.moveTo(-15, -15);
    groundShape.lineTo(15, -15);
    groundShape.lineTo(15, 15);
    groundShape.lineTo(-15, 15);
    groundShape.closePath();

    // 穴（Pit）の位置を地面からくり抜く
    if (pitData) {
        pitData.forEach(pit => {
            const halfW = pit.width / 2;
            const halfD = pit.depth / 2;
            const hole = new THREE.Path();
            
            const x = pit.positionX;
            const y = -pit.positionZ;

            hole.moveTo(x - halfW, y - halfD);
            hole.lineTo(x + halfW, y - halfD);
            hole.lineTo(x + halfW, y + halfD);
            hole.lineTo(x - halfW, y + halfD);
            hole.closePath();

            groundShape.holes.push(hole);
        });
    }

    const groundGeometry = new THREE.ShapeGeometry(groundShape);
    const plane = new THREE.Mesh(
        groundGeometry,
        new THREE.MeshBasicMaterial({ map: groundTexture, side: THREE.DoubleSide })
    );
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // 2. 建物（障害物）の作成：6面テクスチャ（textures配列）に対応
    const buildings = [];

    buildingData.forEach(data => {
        const geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);
        
        let materials;
        if (data.textures && data.textures.length === 6) {
            // 6面それぞれの画像を指定している場合
            materials = data.textures.map(path => {
                const texture = textureLoader.load(path);
                texture.colorSpace = THREE.SRGBColorSpace;
                return new THREE.MeshBasicMaterial({ map: texture });
            });
        } else {
            // texturesの指定がない場合はデフォルトのwall.jpgを使用
            const defaultTexture = textureLoader.load('./public/textures/wall.jpg');
            defaultTexture.colorSpace = THREE.SRGBColorSpace;
            materials = new THREE.MeshBasicMaterial({ map: defaultTexture });
        }

        const mesh = new THREE.Mesh(geometry, materials);
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