import * as THREE from 'three';

export function createPlayer(scene) {
    const playerGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    
    player.position.y = 0.9; 
    scene.add(player);

    player.velocityY = 0;
    player.isJumping = false;

    return player;
}

export function updatePlayer(player, keys, buildings) {
    const speed = 0.1;
    const gravity = 0.008;
    const jumpPower = 0.18;

    // --- 1. X方向の移動と壁判定 ---
    if (keys.ArrowLeft)  player.position.x -= speed;
    if (keys.ArrowRight) player.position.x += speed;

    let playerBox = new THREE.Box3().setFromObject(player);
    for (const b of buildings) {
        // プレイヤーの足元が建物の屋根より低い位置にある場合のみ、横の壁として押し戻す
        if (playerBox.intersectsBox(b.box3) && (player.position.y - 0.9) < b.topY) {
            if (keys.ArrowLeft)  player.position.x += speed;
            if (keys.ArrowRight) player.position.x -= speed;
        }
    }

    // --- 2. Z方向の移動と壁判定 ---
    if (keys.ArrowUp)    player.position.z -= speed;
    if (keys.ArrowDown)  player.position.z += speed;

    playerBox.setFromObject(player);
    for (const b of buildings) {
        if (playerBox.intersectsBox(b.box3) && (player.position.y - 0.9) < b.topY) {
            if (keys.ArrowUp)    player.position.z += speed;
            if (keys.ArrowDown)  player.position.z -= speed;
        }
    }

    // --- 3. ジャンプ・重力・着地（段差登り）判定 ---
    if (keys.Space && !player.isJumping) {
        player.velocityY = jumpPower;
        player.isJumping = true;
    }

    player.velocityY -= gravity;
    player.position.y += player.velocityY;

    // 基本の地面の高さ
    let groundY = 0.9;

    // 建物の「屋根の上」に乗れるかどうかのチェック
    for (const b of buildings) {
        // 建物の真上（水平方向の範囲内）にいるか確認
        const halfW = b.geometry.parameters.width / 2;
        const halfD = b.geometry.parameters.depth / 2;

        if (player.position.x > b.position.x - halfW &&
            player.position.x < b.position.x + halfW &&
            player.position.z > b.position.z - halfD &&
            player.position.z < b.position.z + halfD) {
            
            // 屋根の上のY座標 ＝ 建物の高さ ＋ プレイヤーの半身(0.9)
            const roofY = b.topY + 0.9;

            // 下からジャンプして突き抜ける時は無視し、上から落ちてきて屋根の近くにいるとき着地させる
            if (player.velocityY <= 0 && player.position.y >= roofY - 0.6 && player.position.y <= roofY + 0.6) {
                if (roofY > groundY) {
                    groundY = roofY; // 一番高い足場を優先
                }
            }
        }
    }

    // 着地処理
    if (player.position.y <= groundY) {
        player.position.y = groundY;
        player.velocityY = 0;
        player.isJumping = false;
    }
}