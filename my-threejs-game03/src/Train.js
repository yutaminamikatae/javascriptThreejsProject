import * as THREE from 'three';

// 電車（板）を生成する関数
export function createTrain(scene) {
    // 電車（板）のサイズ設定：幅3, 高さ0.3, 奥行き5
    const geometry = new THREE.BoxGeometry(3, 0.3, 5);
    const material = new THREE.MeshBasicMaterial({ color: 0x3366ff }); // 青い板
    const train = new THREE.Mesh(geometry, material);
    
    scene.add(train);

    // 当たり判定と周回パラメータを付与
    train.box3 = new THREE.Box3();
    train.orbitParams = {
        centerX: 0,    // 周回中心X
        centerZ: 0,    // 周回中心Z
        radius: 8,     // 周回半径
        speed: 0.005,  // スピード
        angle: 0       // 現在の角度
    };
    
    // プレイヤーの追従計算に使う「1フレーム前の位置」
    train.prevX = train.position.x;
    train.prevZ = train.position.z;

    return train;
}

// 電車を移動させる関数
export function updateTrain(train) {
    if (!train) return;

    const params = train.orbitParams;

    // 現在位置を「1フレーム前の位置」として保存
    train.prevX = train.position.x;
    train.prevZ = train.position.z;

    // 角度を進めて円運動の座標を計算
    params.angle += params.speed;
    train.position.x = params.centerX + Math.cos(params.angle) * params.radius;
    train.position.z = params.centerZ + Math.sin(params.angle) * params.radius;
    train.position.y = 1.0; // 高さは固定

    // 進行方向を向くように回転（進行角度を合わせる）
    train.rotation.y = -params.angle;

    // 衝突判定ボックス（Box3）の位置を更新
    train.box3.setFromObject(train);
}