import * as THREE from 'three';

export function createPlayer(scene) {
    const playerGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    const textureLoader = new THREE.TextureLoader();

    // ★ご指定いただいた面ごとのテクスチャ設定を反映
    const materials = [
        new THREE.MeshBasicMaterial({ map: textureLoader.load('./public/textures/player_leftside.jpg') }),  
        new THREE.MeshBasicMaterial({ map: textureLoader.load('./public/textures/player_rightside.jpg') }),  
        new THREE.MeshBasicMaterial({ map: textureLoader.load('./public/textures/player_top.png') }),   
        new THREE.MeshBasicMaterial({ map: textureLoader.load('./public/textures/player_bottom.png') }),
        new THREE.MeshBasicMaterial({ map: textureLoader.load('./public/textures/player_front.jpg') }), 
        new THREE.MeshBasicMaterial({ map: textureLoader.load('./public/textures/player_back.jpg') })   
    ];

    materials.forEach(mat => {
        if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
    });

    const player = new THREE.Mesh(playerGeometry, materials);
    player.position.y = 0.9; 
    scene.add(player);

    player.velocityY = 0;
    player.isJumping = false;

    return player;
}

export function updatePlayer(player, keys, buildings, config, camera, train) {
    const speed = config.playerSpeed;
    const gravity = config.gravity;
    const jumpPower = config.jumpPower;

    // --- カメラ基準の移動ベクトルの計算 ---
    const cameraForward = new THREE.Vector3();
    camera.getWorldDirection(cameraForward);
    cameraForward.y = 0;
    cameraForward.normalize();

    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveDir = new THREE.Vector3();
    if (keys.ArrowUp || keys.w)    moveDir.add(cameraForward);
    if (keys.ArrowDown || keys.s)  moveDir.sub(cameraForward);
    if (keys.ArrowLeft || keys.a)  moveDir.sub(cameraRight);
    if (keys.ArrowRight || keys.d) moveDir.add(cameraRight);

    if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
    }

    // --- 移動と壁（建物）との衝突判定 ---
    if (moveDir.lengthSq() > 0) {
        // X軸移動
        player.position.x += moveDir.x * speed;
        let playerBox = new THREE.Box3().setFromObject(player);
        for (const b of buildings) {
            if (playerBox.intersectsBox(b.box3) && (player.position.y - 0.9) < b.topY) {
                player.position.x -= moveDir.x * speed;
            }
        }

        // Z軸移動
        player.position.z += moveDir.z * speed;
        playerBox.setFromObject(player);
        for (const b of buildings) {
            if (playerBox.intersectsBox(b.box3) && (player.position.y - 0.9) < b.topY) {
                player.position.z -= moveDir.z * speed;
            }
        }

        // プレイヤーの向きを変更
        const angle = Math.atan2(moveDir.x, moveDir.z);
        player.rotation.y = angle;
    }

    // --- ジャンプと重力 ---
    if (keys.Space && !player.isJumping) {
        player.velocityY = jumpPower;
        player.isJumping = true;
    }

    player.velocityY -= gravity;
    player.position.y += player.velocityY;

    let groundY = 0.9;

    // 建物の屋根への着地判定
    for (const b of buildings) {
        const halfW = b.geometry.parameters.width / 2;
        const halfD = b.geometry.parameters.depth / 2;

        if (player.position.x > b.position.x - halfW &&
            player.position.x < b.position.x + halfW &&
            player.position.z > b.position.z - halfD &&
            player.position.z < b.position.z + halfD) {
            
            const roofY = b.topY + 0.9;

            if (player.velocityY <= 0 && player.position.y >= roofY - 0.6 && player.position.y <= roofY + 0.6) {
                if (roofY > groundY) {
                    groundY = roofY;
                }
            }
        }
    }

    // --- 地面との接地処理 ---
    if (player.position.y <= groundY) {
        player.position.y = groundY;
        player.velocityY = 0;
        player.isJumping = false;
    }

    // --- 電車（板）の上に乗っている場合の追従処理 ---
    if (train) {
        const halfW = 3 / 2; // 電車板の幅の半分
        const halfD = 5 / 2; // 電車板の奥行きの半分

        // 電車の範囲内にプレイヤーがいるか
        const isOnTrainX = player.position.x > train.position.x - halfW && player.position.x < train.position.x + halfW;
        const isOnTrainZ = player.position.z > train.position.z - halfD && player.position.z < train.position.z + halfD;

        const trainSurfaceY = 1.0 + 0.15; // 電車の上面の高さ
        const playerFeetY = player.position.y - 0.9;

        // 接地判定
        if (isOnTrainX && isOnTrainZ && playerFeetY >= trainSurfaceY - 0.3 && playerFeetY <= trainSurfaceY + 0.3) {
            // 前フレームからの電車の移動量（差分）を計算
            const trainDeltaX = train.position.x - train.prevX;
            const trainDeltaZ = train.position.z - train.prevZ;

            // プレイヤーを電車と一緒に移動させる
            player.position.x += trainDeltaX;
            player.position.z += trainDeltaZ;

            // 足元を電車の上面に合わせる
            player.position.y = trainSurfaceY + 0.9;
            player.velocityY = 0;
            player.isJumping = false;
        }
    }
}