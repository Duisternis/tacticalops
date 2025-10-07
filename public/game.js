let kills = 0;
let shots = 0;
let combo = 0;
let wave = 1;
let targetsDestroyed = 0;
let targetsPerWave = 5;
let spawnInterval;
let activeTargets = 0;
let maxTargets = 3;
let gameStarted = false;

function startGame() {
    runMining();
    document.getElementById('startOverlay').classList.add('hidden');
    gameStarted = true;
    kills = 0;
    shots = 0;
    combo = 0;
    wave = 1;
    targetsDestroyed = 0;
    updateHUD();
    setTimeout(startWave, 1000);
}

function startWave() {
    showWaveIndicator(wave);
    spawnInterval = setInterval(() => {
        if (activeTargets < maxTargets) {
            spawnTarget();
        }
    }, 1200 - (wave * 50));
}

function showWaveIndicator(waveNum) {
    const indicator = document.createElement('div');
    indicator.className = 'wave-indicator';
    indicator.textContent = `WAVE ${waveNum}`;
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 1500);
}

function spawnTarget() {
    const canvas = document.getElementById('gameCanvas');
    const target = document.createElement('div');
    target.className = 'target';

    const targetSize = 80;
    const maxX = canvas.offsetWidth - targetSize - 100;
    const maxY = canvas.offsetHeight - targetSize - 100;
    const x = Math.random() * maxX + 50;
    const y = Math.random() * maxY + 50;

    target.innerHTML = '<div class="target-inner"></div>';
    target.style.left = x + 'px';
    target.style.top = y + 'px';

    activeTargets++;

    target.onclick = function (e) {
        e.stopPropagation();
        destroyTarget(target, e.clientX, e.clientY);
    };

    canvas.appendChild(target);

    setTimeout(() => {
        if (target.parentNode) {
            target.remove();
            activeTargets--;
            combo = 0;
            updateHUD();
        }
    }, 3000 - (wave * 100));
}

function destroyTarget(target, x, y) {
    kills++;
    combo++;
    targetsDestroyed++;
    activeTargets--;
    shots++;

    createExplosion(x, y);
    showHitMarker(x, y);
    createMuzzleFlash(x, y);

    if (combo >= 5 && combo % 5 === 0) {
        showStreakNotification(combo);
    }

    target.remove();
    updateHUD();

    if (targetsDestroyed >= targetsPerWave) {
        nextWave();
    }
}

function nextWave() {
    clearInterval(spawnInterval);
    wave++;
    targetsDestroyed = 0;
    targetsPerWave += 2;
    maxTargets = Math.min(5, 3 + Math.floor(wave / 2));

    setTimeout(startWave, 2000);
}

function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = x + 'px';
    explosion.style.top = y + 'px';
    document.body.appendChild(explosion);

    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'explosion-particle';
        const angle = (i / 12) * Math.PI * 2;
        const distance = 50 + Math.random() * 30;
        particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
        explosion.appendChild(particle);
    }

    setTimeout(() => explosion.remove(), 600);
}

function showHitMarker(x, y) {
    const marker = document.createElement('div');
    marker.className = 'hit-marker';
    marker.textContent = '+' + (combo * 10);
    marker.style.left = x + 'px';
    marker.style.top = y + 'px';
    document.body.appendChild(marker);
    setTimeout(() => marker.remove(), 600);
}

function createMuzzleFlash(x, y) {
    const flash = document.createElement('div');
    flash.className = 'muzzle-flash';
    flash.style.left = (x - 50) + 'px';
    flash.style.top = (y - 50) + 'px';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 100);
}

function showStreakNotification(streak) {
    const notification = document.createElement('div');
    notification.className = 'streak-notification';
    notification.textContent = `${streak}X COMBO!`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 1000);
}

function showMissIndicator(x, y) {
    const indicator = document.createElement('div');
    indicator.className = 'miss-indicator';
    indicator.textContent = 'MISS';
    indicator.style.left = x + 'px';
    indicator.style.top = y + 'px';
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 400);
}

function updateHUD() {
    document.getElementById('kills').textContent = kills;
    document.getElementById('combo').textContent = combo + 'x';
    document.getElementById('wave').textContent = wave;
    const acc = shots > 0 ? Math.round((kills / shots) * 100) : 100;
    document.getElementById('accuracy').textContent = acc + '%';
}

document.getElementById('gameCanvas').addEventListener('click', function (e) {
    if (gameStarted && e.target.id === 'gameCanvas') {
        shots++;
        combo = 0;
        createMuzzleFlash(e.clientX, e.clientY);
        showMissIndicator(e.clientX, e.clientY);
        updateHUD();
    }
});

// Custom cursor
document.addEventListener('mousemove', (e) => {
    const crosshair = document.querySelector('.crosshair');
    crosshair.style.left = e.clientX + 'px';
    crosshair.style.top = e.clientY + 'px';
});