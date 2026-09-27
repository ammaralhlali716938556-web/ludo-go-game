import { audio } from './audio.js';

export class PawnManager {
  constructor(scene, circuitTiles) {
    this.scene = scene;
    this.circuitTiles = circuitTiles;
    this.pawns = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.teams = [
      { id: 0, name: 'الأحمر', color: 0xff3838, startTile: 0, baseOrigin: { x: -4.8, z: 4.8 } },
      { id: 1, name: 'الأخضر', color: 0x10ac84, startTile: 13, baseOrigin: { x: -4.8, z: -4.8 } },
      { id: 2, name: 'الأصفر', color: 0xff9f1a, startTile: 26, baseOrigin: { x: 4.8, z: -4.8 } },
      { id: 3, name: 'الأزرق', color: 0x2e86de, startTile: 39, baseOrigin: { x: 4.8, z: 4.8 } }
    ];

    this.init16Pawns();
  }

  init16Pawns() {
    this.teams.forEach(team => {
      for (let i = 0; i < 4; i++) {
        const pawnMesh = this.createFigurine(team.color);
        // Base slot offsets
        const ox = (i % 2 === 0 ? -0.5 : 0.5);
        const oz = (i < 2 ? -0.5 : 0.5);
        const basePos = new THREE.Vector3(team.baseOrigin.x + ox, 0.45, team.baseOrigin.z + oz);

        pawnMesh.position.copy(basePos);
        this.scene.add(pawnMesh);

        this.pawns.push({
          id: `${team.id}_${i}`,
          teamId: team.id,
          mesh: pawnMesh,
          stepIndex: -1, // -1 means inside Home Base
          basePos: basePos,
          isHome: true
        });
      }
    });
  }

  createFigurine(colorHex) {
    const group = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });
    const resinMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.7, roughness: 0.2 });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.2, 16), goldMat);
    base.castShadow = true;
    group.add(base);

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.26, 0.5, 16), resinMat);
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), resinMat);
    head.position.y = 0.7;
    head.castShadow = true;
    group.add(head);

    return group;
  }

  getMovablePawns(teamId, roll) {
    return this.pawns.filter(p => {
      if (p.teamId !== teamId) return false;
      if (p.isHome) return roll === 6; // Rule of 6
      return (p.stepIndex + roll) <= 56;
    });
  }

  movePawnAnimated(pawn, roll, onComplete) {
    if (pawn.isHome && roll === 6) {
      pawn.isHome = false;
      pawn.stepIndex = 0;
      const startTile = this.teams[pawn.teamId].startTile;
      const dest = this.circuitTiles[startTile].pos;
      audio.play('hop');
      this.jumpTo(pawn.mesh, dest, () => onComplete(pawn));
      return;
    }

    this.stepSequence(pawn, roll, onComplete);
  }

  stepSequence(pawn, remaining, onDone) {
    if (remaining <= 0) {
      onDone(pawn);
      return;
    }
    pawn.stepIndex++;
    const actualTile = (this.teams[pawn.teamId].startTile + pawn.stepIndex) % 52;
    const dest = this.circuitTiles[actualTile].pos;
    audio.play('hop');

    this.jumpTo(pawn.mesh, dest, () => {
      this.stepSequence(pawn, remaining - 1, onDone);
    });
  }

  jumpTo(mesh, targetPos, callback) {
    new TWEEN.Tween(mesh.position)
      .to({ x: targetPos.x, z: targetPos.z }, 200)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();

    new TWEEN.Tween(mesh.position)
      .to({ y: targetPos.y + 1.0 }, 100)
      .yoyo(true)
      .repeat(1)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onComplete(callback)
      .start();
  }
}
