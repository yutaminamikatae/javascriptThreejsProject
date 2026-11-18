import { waterData } from './waterData.js';
import { pitData } from './pitData.js';

export const buildingData = [
    // --- 【新規】位置 7・8・9 の奥全体を覆う大きな壁 ---
    { 
        width: 30, height: 30, depth: 1,  // 幅30（地面と同じ）、高さ6、厚み1
        positionX: 0, positionZ: -15,    // マップの一番奥の端に配置
        textures: [
            './public/textures/wall1.png',
            './public/textures/wall1.png',
            './public/textures/wall1.png',
            './public/textures/wall1.png',
            './public/textures/wall1.png', // 前面
            './public/textures/wall1.png'  // 背面
        ]
    },

    // --- 位置 7: 左奥の建物 ---
    { 
        width: 4, height: 4, depth: 4, 
        positionX: -10, positionZ: -10,
        textures: [
            './public/textures/building_right.png',
            './public/textures/building_left.png',
            './public/textures/building_top.png',
            './public/textures/building_bottom.png',
            './public/textures/building_front.png',
            './public/textures/building_back.png'
        ]
    },

    { 
        width: 4, height: 4, depth: 4, 
        positionX: -10, positionZ: -10,
        textures: [
            './public/textures/building_right.png',
            './public/textures/building_left.png',
            './public/textures/building_top.png',
            './public/textures/building_bottom.png',
            './public/textures/building_front.png',
            './public/textures/building_back.png'
        ]
    },

    // --- 位置 8: 中央奥 ---
    { 
        width: 4, height: 5, depth: 4, 
        positionX: 0, positionZ: -10,
        textures: [
            './public/textures/building_right.png',
            './public/textures/building_left.png',
            './public/textures/building_top.png',
            './public/textures/building_bottom.png',
            './public/textures/building_front.png',
            './public/textures/building_back.png'
        ]
    },

    // --- 位置 9: 右奥の建物 ---
    { 
        width: 4, height: 3, depth: 4, 
        positionX: 10, positionZ: -10,
        textures: [
            './public/textures/building_right.png',
            './public/textures/building_left.png',
            './public/textures/building_top.png',
            './public/textures/building_bottom.png',
            './public/textures/building_front.png',
            './public/textures/building_back.png'
        ]
    },
    // --- 位置 6: 右中央 ---
    { 
        width: 3, height: 6, depth: 3, 
        positionX: 10, positionZ: 0,
        textures: [
            './public/textures/building_right.png',
            './public/textures/building_left.png',
            './public/textures/building_top.png',
            './public/textures/building_bottom.png',
            './public/textures/building_front.png',
            './public/textures/building_back.png'
        ]
    },

    // --- 位置 3: 右手前 ---
    { 
        width: 4, height: 2, depth: 4, 
        positionX: 10, positionZ: 10,
        textures: [
            './public/textures/building_right.png',
            './public/textures/building_left.png',
            './public/textures/building_top.png',
            './public/textures/building_bottom.png',
            './public/textures/building_front.png',
            './public/textures/building_back.png'
        ]
    }
];

export { waterData, pitData };