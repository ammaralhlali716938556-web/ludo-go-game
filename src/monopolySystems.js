import { audio } from './audio.js';

export class MonopolySystems {
  constructor(landmarks) {
    this.landmarks = landmarks;
    this.cash = 5000;
    this.rolls = 50;
    this.maxRolls = 50;
    this.shields = 2;
    this.multiplier = 1;

    this.renderLandmarksUI();
  }

  cycleMultiplier() {
    this.multiplier = this.multiplier === 1 ? 2 : this.multiplier === 2 ? 3 : this.multiplier === 3 ? 5 : 1;
    document.getElementById('btn-mult').innerText = `X${this.multiplier}`;
    document.getElementById('roll-cost').innerText = `استهلاك ${this.multiplier}🎲`;
  }

  triggerTileReward(tile) {
    if (tile.type === 'ATTACK') {
      this.openShutDown();
    } else if (tile.type === 'HEIST') {
      this.openBankHeist();
    } else {
      const reward = (tile.type === 'SAFE' ? 500 : 150) * this.multiplier;
      this.addCash(reward);
      this.showToast('مكافأة مسار! 🪙', `+ ${reward.toLocaleString()} $`);
    }
  }

  addCash(amt) {
    this.cash += amt;
    document.getElementById('cash-txt').innerText = `${this.cash.toLocaleString()} $`;
    audio.play('coins');
  }

  // --- Shut Down Mini-Game ---
  openShutDown() {
    audio.play('attack');
    const modal = document.getElementById('shutdown-modal');
    const grid = document.getElementById('shutdown-targets');
    grid.innerHTML = '';
    modal.classList.add('open');

    ['برج القائد', 'قصر الزمرد', 'طاحونة النور'].forEach((name) => {
      const btn = document.createElement('button');
      btn.className = 'target-btn';
      btn.innerText = `🎯\n${name}`;
      btn.onclick = () => {
        modal.classList.remove('open');
        const loot = 1200 * this.multiplier;
        this.addCash(loot);
        this.showToast('🚀 قصف ناجح!', `دمرت معلماً ونهبت ${loot.toLocaleString()} $`);
      };
      grid.appendChild(btn);
    });
  }

  // --- Bank Heist Mini-Game ---
  openBankHeist() {
    const modal = document.getElementById('heist-modal');
    const grid = document.getElementById('vault-grid');
    grid.innerHTML = '';
    modal.classList.add('open');

    const rewards = ['💎', '💎', '💎', '💰', '💰', '🪙', '🪙', '🪙', '🪙'];
    rewards.sort(() => Math.random() - 0.5);

    rewards.forEach((symbol) => {
      const door = document.createElement('button');
      door.className = 'vault-door';
      door.innerText = '🔒';
      door.onclick = () => {
        door.innerText = symbol;
        door.style.background = '#ffd32a';
        setTimeout(() => {
          modal.classList.remove('open');
          const prize = (symbol === '💎' ? 2500 : symbol === '💰' ? 1500 : 800) * this.multiplier;
          this.addCash(prize);
          this.showToast('سرقة خزنة مكتملة! 🎉', `ربحت ${prize.toLocaleString()} $`);
        }, 800);
      };
      grid.appendChild(door);
    });
  }

  // --- Landmarks Upgrade Modal ---
  openBuildModal() {
    this.renderLandmarksUI();
    document.getElementById('build-modal').classList.add('open');
  }
  closeBuildModal() {
    document.getElementById('build-modal').classList.remove('open');
  }
  renderLandmarksUI() {
    const list = document.getElementById('landmarks-list');
    if (!list) return;
    list.innerHTML = '';
    this.landmarks.forEach((lm, idx) => {
      const cost = lm.level * 1500;
      const row = document.createElement('div');
      row.className = 'landmark-row';
      row.innerHTML = `
        <span class="lm-name">${lm.name} (مستوى ${lm.level}⭐)</span>
        <button class="btn-upgrade" id="lm-btn-${idx}">${cost.toLocaleString()} $</button>
      `;
      row.querySelector('button').onclick = () => this.upgradeLandmark(idx, cost);
      list.appendChild(row);
    });
  }

  upgradeLandmark(idx, cost) {
    if (this.cash >= cost) {
      this.cash -= cost;
      document.getElementById('cash-txt').innerText = `${this.cash.toLocaleString()} $`;
      this.landmarks[idx].level++;
      this.landmarks[idx].mesh.scale.multiplyScalar(1.15); // Visually grow 3D model!
      audio.play('coins');
      this.renderLandmarksUI();
      this.showToast('تمت الترقية! 🏰', `وصل ${this.landmarks[idx].name} إلى مستوى أعلى!`);
    } else {
      alert('لا تملك رصيداً كافياً من الذهب!');
    }
  }

  showToast(title, sub) {
    const toast = document.getElementById('toast-popup');
    document.getElementById('toast-title').innerText = title;
    document.getElementById('toast-sub').innerText = sub;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1600);
  }
}
