import { buildLudoBoard } from './board.js';
import { PawnManager } from './pawnManager.js';
import { MonopolySystems } from './monopolySystems.js';
import { audio } from './audio.js';

// Setup Three.js Scene
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x190c29);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 19, 16);
camera.lookAt(0, 0, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Lights
const ambient = new THREE.AmbientLight(0xfff6ea, 0.85);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
dirLight.position.set(10, 22, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// Build Board & Initialize Systems
const { circuitTiles, landmarks, boardGroup } = buildLudoBoard(scene);
const pawnManager = new PawnManager(scene, circuitTiles);
const gameSystems = new MonopolySystems(landmarks);
window.gameSystems = gameSystems;

// 3D Dice
const diceMesh = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 1.2, 1.2),
  new THREE.MeshPhysicalMaterial({ color: 0xeb2f06, clearcoat: 1.0, roughness: 0.1 })
);
diceMesh.position.set(0, 1.8, 0);
diceMesh.castShadow = true;
scene.add(diceMesh);

let currentTurn = 0; // 0 = Player Red, 1 = Green, 2 = Yellow, 3 = Blue
let isBusy = false;

window.gameMain = {
  onRollClicked() {
    if (isBusy || currentTurn !== 0) return;
    if (gameSystems.rolls < gameSystems.multiplier) {
      alert('نفدت الرميات! انتظر التجدد أو قم بترقية معالمك.');
      return;
    }
    gameSystems.rolls -= gameSystems.multiplier;
    document.getElementById('rolls-txt').innerText = `${gameSystems.rolls} / ${gameSystems.maxRolls}`;
    this.rollDice();
  },

  rollDice() {
    isBusy = true;
    document.getElementById('btn-roll').disabled = true;
    audio.play('roll');

    const rollVal = Math.floor(Math.random() * 6) + 1;

    // Camera Focus on Center
    new TWEEN.Tween(camera.position).to({ y: 14, z: 12 }, 400).start();

    // Dice Jump Animation
    new TWEEN.Tween(diceMesh.position).to({ y: 4.2 }, 300).yoyo(true).repeat(1).start();
    new TWEEN.Tween(diceMesh.rotation)
      .to({ x: diceMesh.rotation.x + Math.PI * 4, y: diceMesh.rotation.y + Math.PI * 4 + rollVal }, 600)
      .onComplete(() => {
        new TWEEN.Tween(camera.position).to({ y: 19, z: 16 }, 400).start();
        this.handleTurnLogic(currentTurn, rollVal);
      })
      .start();
  },

  handleTurnLogic(teamId, roll) {
    const movable = pawnManager.getMovablePawns(teamId, roll);

    if (movable.length === 0) {
      gameSystems.showToast('لا حركة متاحة!', `حصلت على ${roll}`);
      setTimeout(() => this.passTurn(roll === 6), 900);
      return;
    }

    if (teamId === 0) {
      // Player: Prompt selection or auto-move if only 1 pawn
      if (movable.length === 1) {
        pawnManager.movePawnAnimated(movable[0], roll, (pawn) => this.onPawnLanded(pawn, roll));
      } else {
        const prompt = document.getElementById('prompt-box');
        prompt.classList.add('show');
        // Simple click listener for eligible pawns
        const onSelect = () => {
          prompt.classList.remove('show');
          pawnManager.movePawnAnimated(movable[0], roll, (pawn) => this.onPawnLanded(pawn, roll));
          window.removeEventListener('pointerdown', onSelect);
        };
        window.addEventListener('pointerdown', onSelect);
      }
    } else {
      // AI Turn
      setTimeout(() => {
        pawnManager.movePawnAnimated(movable[0], roll, (pawn) => this.onPawnLanded(pawn, roll));
      }, 500);
    }
  },

  onPawnLanded(pawn, roll) {
    if (pawn.stepIndex >= 0) {
      const tile = circuitTiles[(pawnManager.teams[pawn.teamId].startTile + pawn.stepIndex) % 52];
      if (pawn.teamId === 0) {
        gameSystems.triggerTileReward(tile);
      }
    }
    setTimeout(() => this.passTurn(roll === 6), 1000);
  },

  passTurn(extraRoll) {
    isBusy = false;
    if (extraRoll) {
      gameSystems.showToast('رمية مجانية إضافية! 🎲', 'حصلت على رقم 6');
    } else {
      currentTurn = (currentTurn + 1) % 4;
    }

    document.getElementById('turn-txt').innerText = `الدور: ${pawnManager.teams[currentTurn].name}`;
    if (currentTurn === 0) {
      document.getElementById('btn-roll').disabled = false;
    } else {
      setTimeout(() => window.gameMain.rollDice(), 1000);
    }
  }
};

// Render Loop
function animate(time) {
  requestAnimationFrame(animate);
  TWEEN.update(time);
  boardGroup.rotation.y = Math.sin(time * 0.0004) * 0.03;
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
