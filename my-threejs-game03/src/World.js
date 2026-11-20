import * as THREE from 'three';
import {
    AREA_GROUND_TEXTURES,
    buildingData,
    waterData,
    pitData,
    groundTiles,
    propData,
    DEFAULT_GROUND_TEXTURE,
    DEFAULT_WALL_TEXTURE
} from './mapData.js';
import { createTrain } from './Train.js';
import { createWater } from './Water.js';
import { createPits } from './Pit.js';
import { createProps } from './Props.js';

const textureCache = new Map();

function getCachedTexture(textureLoader, path, fallbackPath = null, options = {}) {
    const cacheKey = `${path}|${options.repeatX ?? 1}|${options.repeatY ?? 1}|${options.rotation ?? 0}`;
    if (textureCache.has(cacheKey)) {
        return textureCache.get(cacheKey);
    }

    const tex = textureLoader.load(
        path,
        undefined,
        undefined,
        () => {
            if (fallbackPath && path !== fallbackPath) {
                const fallbackTex = getCachedTexture(textureLoader, fallbackPath, null, {});
                tex.image = fallbackTex.image;
                tex.needsUpdate = true;
            }
        }
    );

    tex.colorSpace = THREE.SRGBColorSpace;

    if (options.repeatX || options.repeatY) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(options.repeatX ?? 1, options.repeatY ?? 1);
    }

    if (typeof options.rotation === 'number' && options.rotation !== 0) {
        tex.center.set(0.5, 0.5);
        tex.rotation = options.rotation;
    }

    textureCache.set(cacheKey, tex);
    return tex;
}

function isInWestSquare(x, z) {
    return x >= -15 && x <= 15 && z >= -15 && z <= 15;
}

function isPitHole(pit) {
    return (pit?.depthY ?? 0) > 0 && !((pit?.heightY ?? 0) > 0);
}

function createPolygonShape(points) {
    const shape = new THREE.Shape();
    points.forEach((pt, idx) => {
        if (idx === 0) {
            shape.moveTo(pt.x, -pt.z);
        } else {
            shape.lineTo(pt.x, -pt.z);
        }
    });
    shape.closePath();
    return shape;
}

function createAreaGroundMesh(textureLoader, points, texturePath, repeatX, repeatY, pits = []) {
    const tex = getCachedTexture(
        textureLoader,
        texturePath || DEFAULT_GROUND_TEXTURE,
        DEFAULT_GROUND_TEXTURE,
        { repeatX, repeatY }
    );

    const shape = createPolygonShape(points);

    if (Array.isArray(pits)) {
        pits.filter(isPitHole).forEach(pit => {
            const halfW = (pit.width ?? 6) / 2;
            const halfD = (pit.depth ?? 5) / 2;
            const cx = pit.positionX ?? 0;
            const cy = -(pit.positionZ ?? 0);

            const hole = new THREE.Path();
            hole.moveTo(cx - halfW, cy - halfD);
            hole.lineTo(cx - halfW, cy + halfD);
            hole.lineTo(cx + halfW, cy + halfD);
            hole.lineTo(cx + halfW, cy - halfD);
            hole.closePath();
            shape.holes.push(hole);
        });
    }

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
}

function createRaisedSteps(textureLoader, pits = [], eastTexturePath) {
    const group = new THREE.Group();
    if (!Array.isArray(pits)) return group;

    const stepTex = getCachedTexture(
        textureLoader,
        eastTexturePath || DEFAULT_GROUND_TEXTURE,
        DEFAULT_GROUND_TEXTURE,
        { repeatX: 1, repeatY: 1 }
    );
    const sideTex = getCachedTexture(
        textureLoader,
        DEFAULT_WALL_TEXTURE,
        DEFAULT_GROUND_TEXTURE,
        { repeatX: 1, repeatY: 1 }
    );

    pits.filter(p => (p?.heightY ?? 0) > 0).forEach(step => {
        const h = step.heightY;
        const geo = new THREE.BoxGeometry(step.width, h, step.depth);
        const mats = [
            new THREE.MeshBasicMaterial({ map: sideTex }),
            new THREE.MeshBasicMaterial({ map: sideTex }),
            new THREE.MeshBasicMaterial({ map: stepTex }),
            new THREE.MeshBasicMaterial({ map: sideTex }),
            new THREE.MeshBasicMaterial({ map: sideTex }),
            new THREE.MeshBasicMaterial({ map: sideTex })
        ];
        const mesh = new THREE.Mesh(geo, mats);
        mesh.position.set(step.positionX, h / 2, step.positionZ);
        group.add(mesh);
    });

    return group;
}

function buildTilesGroup(textureLoader, tiles, pits) {
    const group = new THREE.Group();
    if (!Array.isArray(tiles)) return group;

    const holePits = Array.isArray(pits) ? pits.filter(isPitHole) : [];

    tiles.forEach(tile => {
        const tileW = tile.width ?? 6;
        const tileD = tile.depth ?? 6;
        const tileX = tile.x ?? 0;
        const tileZ = tile.z ?? 0;

        const overlapsHole = holePits.some(pit => {
            const pitHalfW = (pit.width ?? 6) / 2;
            const pitHalfD = (pit.depth ?? 5) / 2;
            const pitX = pit.positionX ?? 0;
            const pitZ = pit.positionZ ?? 0;

            return (
                Math.abs(tileX - pitX) < (tileW / 2 + pitHalfW) &&
                Math.abs(tileZ - pitZ) < (tileD / 2 + pitHalfD)
            );
        });
        if (overlapsHole) return;

        const tileTex = getCachedTexture(
            textureLoader,
            tile.texture || DEFAULT_GROUND_TEXTURE,
            DEFAULT_GROUND_TEXTURE,
            {
                repeatX: tile.repeatX ?? 1,
                repeatY: tile.repeatY ?? 1,
                rotation: tile.rotation ?? 0
            }
        );

        const tileGeo = new THREE.PlaneGeometry(tileW * 0.999, tileD * 0.999);
        const tileMat = new THREE.MeshBasicMaterial({
            map: tileTex,
            side: THREE.DoubleSide
        });
        const tileMesh = new THREE.Mesh(tileGeo, tileMat);
        tileMesh.rotation.x = -Math.PI / 2;
        tileMesh.position.set(tileX, 0.01, tileZ);
        group.add(tileMesh);
    });

    return group;
}

function resolveBuildingMaterials(textureLoader, data, fallbackWallTex) {
    if (Array.isArray(data.textures) && data.textures.length === 6) {
        return data.textures.map(path => {
            const tex = getCachedTexture(textureLoader, path || DEFAULT_WALL_TEXTURE, DEFAULT_WALL_TEXTURE);
            return new THREE.MeshBasicMaterial({ map: tex });
        });
    }

    if (typeof data.texture === 'string' && data.texture.length > 0) {
        const tex = getCachedTexture(textureLoader, data.texture, DEFAULT_WALL_TEXTURE);
        return new THREE.MeshBasicMaterial({ map: tex });
    }

    return new THREE.MeshBasicMaterial({ map: fallbackWallTex });
}

function buildBuildings(textureLoader, items, targetGroup, fallbackWallTex) {
    const meshes = [];
    if (!Array.isArray(items)) return meshes;

    items.forEach(data => {
        const geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);
        const materials = resolveBuildingMaterials(textureLoader, data, fallbackWallTex);

        const posY = typeof data.positionY === 'number' ? data.positionY : data.height / 2;
        const mesh = new THREE.Mesh(geometry, materials);
        mesh.position.set(data.positionX, posY, data.positionZ);
        targetGroup.add(mesh);

        mesh.box3 = new THREE.Box3().setFromObject(mesh);
        mesh.topY = posY + data.height / 2;
        meshes.push(mesh);
    });

    return meshes;
}

export function createWorld(scene, initialOptions = {}) {
    scene.background = new THREE.Color(0x18202c);

    const textureLoader = new THREE.TextureLoader();
    const fallbackWallTex = getCachedTexture(textureLoader, DEFAULT_WALL_TEXTURE);

    let isMapExpanded = initialOptions.isMapExpanded ?? true;

    const areaTextures = AREA_GROUND_TEXTURES || {
        west: DEFAULT_GROUND_TEXTURE,
        bridge: DEFAULT_GROUND_TEXTURE,
        east: DEFAULT_GROUND_TEXTURE
    };

    const expandedGroup = new THREE.Group();
    expandedGroup.name = 'ExpandedMapGroup';

    const westPoints = [
        { x: -15, z: -15 },
        { x:  15, z: -15 },
        { x:  15, z:  15 },
        { x: -15, z:  15 }
    ];
    const bridgePoints = [
        { x: 15, z: -5 },
        { x: 25, z: -5 },
        { x: 25, z:  5 },
        { x: 15, z:  5 }
    ];
    const eastPoints = [
        { x: 25, z: -15 },
        { x: 55, z: -15 },
        { x: 55, z:  15 },
        { x: 25, z:  15 }
    ];

    const westPits = (pitData || []).filter(p => isInWestSquare(p.positionX, p.positionZ));
    const eastPits = (pitData || []).filter(p => !isInWestSquare(p.positionX, p.positionZ));
    const eastHolePits = eastPits.filter(isPitHole);

    expandedGroup.add(createAreaGroundMesh(textureLoader, westPoints, areaTextures.west, 6, 6, westPits));
    expandedGroup.add(createAreaGroundMesh(textureLoader, bridgePoints, areaTextures.bridge, 2, 2, []));
    expandedGroup.add(createAreaGroundMesh(textureLoader, eastPoints, areaTextures.east, 6, 6, eastHolePits));

    expandedGroup.add(buildTilesGroup(textureLoader, groundTiles, pitData));
    expandedGroup.add(createRaisedSteps(textureLoader, eastPits, areaTextures.east));

    const expandedBuildings = buildBuildings(textureLoader, buildingData, expandedGroup, fallbackWallTex);

    const expandedWaterGroup = new THREE.Group();
    createWater(expandedWaterGroup, waterData);
    expandedGroup.add(expandedWaterGroup);

    const expandedPitGroup = new THREE.Group();
    createPits(expandedPitGroup, textureLoader, (pitData || []).filter(isPitHole));
    expandedGroup.add(expandedPitGroup);

    const expandedProps = createProps(expandedGroup, propData, {
        visible: initialOptions.propsVisible ?? true
    });

    scene.add(expandedGroup);

    const westOnlyGroup = new THREE.Group();
    westOnlyGroup.name = 'WestOnlyMapGroup';

    const westWaters = (waterData || []).filter(w => isInWestSquare(w.positionX, w.positionZ));
    const westTiles = (groundTiles || []).filter(t => isInWestSquare(t.x, t.z));
    const westBuildingData = (buildingData || []).filter(b => isInWestSquare(b.positionX, b.positionZ));
    const westPropData = (propData || []).filter(pr => isInWestSquare(pr.x, pr.z));

    westOnlyGroup.add(createAreaGroundMesh(textureLoader, westPoints, areaTextures.west, 6, 6, westPits));
    westOnlyGroup.add(buildTilesGroup(textureLoader, westTiles, westPits));
    const westBuildings = buildBuildings(textureLoader, westBuildingData, westOnlyGroup, fallbackWallTex);

    const westWaterGroup = new THREE.Group();
    createWater(westWaterGroup, westWaters);
    westOnlyGroup.add(westWaterGroup);

    const westPitGroup = new THREE.Group();
    createPits(westPitGroup, textureLoader, westPits);
    westOnlyGroup.add(westPitGroup);

    const westProps = createProps(westOnlyGroup, westPropData, {
        visible: initialOptions.propsVisible ?? true
    });

    scene.add(westOnlyGroup);

    const train = createTrain(scene);

    const setMapExpanded = (expanded) => {
        isMapExpanded = Boolean(expanded);
        expandedGroup.visible = isMapExpanded;
        westOnlyGroup.visible = !isMapExpanded;
        return isMapExpanded;
    };

    const setPropsVisible = (visible) => {
        const next = Boolean(visible);
        expandedProps.setVisible(next);
        westProps.setVisible(next);
        return next;
    };

    setMapExpanded(isMapExpanded);

    return {
        get isMapExpanded() {
            return isMapExpanded;
        },
        get buildings() {
            return isMapExpanded ? expandedBuildings : westBuildings;
        },
        get pits() {
            return isMapExpanded ? pitData : westPits;
        },
        get propsVisible() {
            return expandedProps.isVisible;
        },
        train,
        setMapExpanded,
        toggleMapExpanded() {
            return setMapExpanded(!isMapExpanded);
        },
        setPropsVisible,
        togglePropsVisible() {
            return setPropsVisible(!expandedProps.isVisible);
        }
    };
}