// 游戏状态
const gameState = {
    currentGame: null,
    drawCount: 0,
    score: 0,
    level: 1,
    energy: 10,
    maxEnergy: 10,
    history: []
};

// 奖品配置
const prizes = [
    { id: 1, name: '特等奖', icon: '👑', probability: 0.02, color: '#ffd700' },
    { id: 2, name: '一等奖', icon: '💎', probability: 0.05, color: '#00ffff' },
    { id: 3, name: '二等奖', icon: '🏆', probability: 0.1, color: '#ff6b6b' },
    { id: 4, name: '三等奖', icon: '🎁', probability: 0.15, color: '#4ecdc4' },
    { id: 5, name: '四等奖', icon: '🎯', probability: 0.2, color: '#95e1d3' },
    { id: 6, name: '五等奖', icon: '🎪', probability: 0.25, color: '#f38181' },
    { id: 7, name: '参与奖', icon: '🎈', probability: 0.23, color: '#aa96da' }
];

// 游戏配置
const gameConfigs = {
    memory: {
        timeLimit: 30,
        gridSize: 4,
        pairs: 8,
        icons: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼']
    },
    reaction: {
        timeLimit: 10,
        targetSize: 80,
        minDelay: 500,
        maxDelay: 2000
    },
    puzzle: {
        size: 3,
        numbers: [1, 2, 3, 4, 5, 6, 7, 8, '']
    }
};

// 游戏实例
let memoryGame = null;
let reactionGame = null;
let puzzleGame = null;

// DOM元素
const elements = {
    gameSelection: document.getElementById('gameSelection'),
    memoryGame: document.getElementById('memoryGame'),
    reactionGame: document.getElementById('reactionGame'),
    puzzleGame: document.getElementById('puzzleGame'),
    drawScreen: document.getElementById('drawScreen'),
    modalOverlay: document.getElementById('modalOverlay'),
    gameOverModal: document.getElementById('gameOverModal'),
    drawBtn: document.getElementById('drawBtn'),
    modalClose: document.getElementById('modalClose'),
    modalRedraw: document.getElementById('modalRedraw'),
    resultDrawBtn: document.getElementById('resultDrawBtn'),
    userLevel: document.getElementById('userLevel'),
    energyFill: document.getElementById('energyFill'),
    energyText: document.getElementById('energyText'),
    userScore: document.getElementById('userScore'),
    drawCount: document.getElementById('drawCount'),
    historyList: document.getElementById('historyList')
};

// 初始化
function init() {
    // 加载游戏状态
    loadGameState();
    
    // 绑定事件
    bindEvents();
    
    // 更新UI
    updateUI();
    
    // 渲染历史记录
    renderHistory();
}

// 绑定事件
function bindEvents() {
    // 游戏选择
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => {
            const game = card.dataset.game;
            startGame(game);
        });
    });
    
    // 抽奖按钮
    elements.drawBtn.addEventListener('click', startDraw);
    
    // 弹窗关闭
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalRedraw.addEventListener('click', startDraw);
    elements.resultDrawBtn.addEventListener('click', goToDraw);
    
    // 键盘事件
    document.addEventListener('keydown', handleKeyboard);
}

// 开始游戏
function startGame(game) {
    // 检查能量
    if (gameState.energy <= 0) {
        showMessage('能量不足，请稍后再试');
        return;
    }
    
    // 消耗能量
    gameState.energy -= 1;
    updateUI();
    saveGameState();
    
    // 隐藏所有界面
    hideAllScreens();
    
    // 显示对应游戏界面
    gameState.currentGame = game;
    elements[game + 'Game'].style.display = 'block';
    
    // 初始化游戏
    switch (game) {
        case 'memory':
            initMemoryGame();
            break;
        case 'reaction':
            initReactionGame();
            break;
        case 'puzzle':
            initPuzzleGame();
            break;
    }
}

// 返回游戏选择
function backToSelection() {
    hideAllScreens();
    elements.gameSelection.style.display = 'block';
    gameState.currentGame = null;
}

// 隐藏所有界面
function hideAllScreens() {
    elements.gameSelection.style.display = 'none';
    elements.memoryGame.style.display = 'none';
    elements.reactionGame.style.display = 'none';
    elements.puzzleGame.style.display = 'none';
    elements.drawScreen.style.display = 'none';
}

// 初始化记忆游戏
function initMemoryGame() {
    const config = gameConfigs.memory;
    const grid = document.getElementById('memoryGrid');
    const startBtn = document.getElementById('memoryStart');
    const timeEl = document.getElementById('memoryTime');
    const scoreEl = document.getElementById('memoryScore');
    
    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let score = 0;
    let timeLeft = config.timeLimit;
    let timer = null;
    
    // 重置游戏
    function resetGame() {
        cards = [];
        flippedCards = [];
        matchedPairs = 0;
        score = 0;
        timeLeft = config.timeLimit;
        
        // 生成卡片
        const icons = [...config.icons, ...config.icons];
        shuffleArray(icons);
        
        grid.innerHTML = '';
        for (let i = 0; i < config.gridSize * config.gridSize; i++) {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.index = i;
            card.innerHTML = `<div class="card-content">${icons[i]}</div>`;
            card.addEventListener('click', handleCardClick);
            grid.appendChild(card);
            cards.push({ element: card, icon: icons[i], flipped: false, matched: false });
        }
        
        timeEl.textContent = `时间: ${timeLeft}s`;
        scoreEl.textContent = `得分: ${score}`;
        startBtn.textContent = '开始游戏';
    }
    
    // 处理卡片点击
    function handleCardClick(e) {
        const card = e.currentTarget;
        const index = parseInt(card.dataset.index);
        const cardData = cards[index];
        
        if (cardData.flipped || cardData.matched || flippedCards.length >= 2) {
            return;
        }
        
        // 翻转卡片
        card.classList.add('flipped');
        cardData.flipped = true;
        flippedCards.push(cardData);
        
        // 检查匹配
        if (flippedCards.length === 2) {
            setTimeout(checkMatch, 500);
        }
    }
    
    // 检查匹配
    function checkMatch() {
        const [card1, card2] = flippedCards;
        
        if (card1.icon === card2.icon) {
            // 匹配成功
            card1.matched = true;
            card2.matched = true;
            card1.element.classList.add('matched');
            card2.element.classList.add('matched');
            matchedPairs++;
            score += 10;
            scoreEl.textContent = `得分: ${score}`;
            
            // 检查游戏完成
            if (matchedPairs === config.pairs) {
                endMemoryGame(true);
            }
        } else {
            // 匹配失败
            card1.flipped = false;
            card2.flipped = false;
            card1.element.classList.remove('flipped');
            card2.element.classList.remove('flipped');
            score = Math.max(0, score - 2);
            scoreEl.textContent = `得分: ${score}`;
        }
        
        flippedCards = [];
    }
    
    // 开始游戏
    function startMemoryGame() {
        resetGame();
        startBtn.textContent = '游戏中...';
        startBtn.disabled = true;
        
        timer = setInterval(() => {
            timeLeft--;
            timeEl.textContent = `时间: ${timeLeft}s`;
            
            if (timeLeft <= 0) {
                endMemoryGame(false);
            }
        }, 1000);
    }
    
    // 结束游戏
    function endMemoryGame(isWin) {
        clearInterval(timer);
        startBtn.textContent = '开始游戏';
        startBtn.disabled = false;
        
        let rewardDraws = 0;
        if (isWin) {
            // 胜利奖励
            if (score >= 70) rewardDraws = 3;
            else if (score >= 50) rewardDraws = 2;
            else rewardDraws = 1;
        } else {
            // 失败奖励
            rewardDraws = 1;
        }
        
        showGameOver(score, rewardDraws);
    }
    
    // 绑定开始按钮
    startBtn.addEventListener('click', startMemoryGame);
    
    // 初始化游戏
    resetGame();
}

// 初始化反应游戏
function initReactionGame() {
    const config = gameConfigs.reaction;
    const area = document.getElementById('reactionArea');
    const target = document.getElementById('reactionTarget');
    const startScreen = document.getElementById('reactionStartScreen');
    const startBtn = document.getElementById('reactionStart');
    const timeEl = document.getElementById('reactionTime');
    const scoreEl = document.getElementById('reactionScore');
    
    let score = 0;
    let timeLeft = config.timeLimit;
    let timer = null;
    let targetTimer = null;
    
    // 显示目标
    function showTarget() {
        const areaRect = area.getBoundingClientRect();
        const maxX = areaRect.width - config.targetSize;
        const maxY = areaRect.height - config.targetSize;
        
        const x = Math.random() * maxX;
        const y = Math.random() * maxY;
        
        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
        target.style.display = 'block';
        
        // 随机延迟后隐藏目标
        targetTimer = setTimeout(() => {
            target.style.display = 'none';
            if (timeLeft > 0) {
                showTarget();
            }
        }, Math.random() * (config.maxDelay - config.minDelay) + config.minDelay);
    }
    
    // 开始游戏
    function startReactionGame() {
        score = 0;
        timeLeft = config.timeLimit;
        
        startScreen.style.display = 'none';
        target.style.display = 'none';
        
        timeEl.textContent = `时间: ${timeLeft}s`;
        scoreEl.textContent = `得分: ${score}`;
        
        // 开始计时器
        timer = setInterval(() => {
            timeLeft--;
            timeEl.textContent = `时间: ${timeLeft}s`;
            
            if (timeLeft <= 0) {
                endReactionGame();
            }
        }, 1000);
        
        // 显示第一个目标
        setTimeout(showTarget, 1000);
    }
    
    // 处理目标点击
    function handleTargetClick() {
        score++;
        scoreEl.textContent = `得分: ${score}`;
        target.style.display = 'none';
        clearTimeout(targetTimer);
        
        if (timeLeft > 0) {
            showTarget();
        }
    }
    
    // 结束游戏
    function endReactionGame() {
        clearInterval(timer);
        clearTimeout(targetTimer);
        target.style.display = 'none';
        startScreen.style.display = 'flex';
        startScreen.style.flexDirection = 'column';
        startScreen.style.alignItems = 'center';
        startScreen.style.justifyContent = 'center';
        
        let rewardDraws = 0;
        if (score >= 15) rewardDraws = 3;
        else if (score >= 10) rewardDraws = 2;
        else rewardDraws = 1;
        
        showGameOver(score, rewardDraws);
    }
    
    // 绑定事件
    startBtn.addEventListener('click', startReactionGame);
    target.addEventListener('click', handleTargetClick);
}

// 初始化拼图游戏
function initPuzzleGame() {
    const config = gameConfigs.puzzle;
    const container = document.getElementById('puzzleContainer');
    const startBtn = document.getElementById('puzzleStart');
    const resetBtn = document.getElementById('puzzleReset');
    const movesEl = document.getElementById('puzzleMoves');
    const timeEl = document.getElementById('puzzleTime');
    
    let puzzle = [];
    let emptyIndex = 8;
    let moves = 0;
    let time = 0;
    let timer = null;
    
    // 生成拼图
    function generatePuzzle() {
        const numbers = [...config.numbers];
        shuffleArray(numbers);
        
        // 确保拼图可解
        while (!isSolvable(numbers)) {
            shuffleArray(numbers);
        }
        
        puzzle = numbers;
        emptyIndex = puzzle.indexOf('');
        moves = 0;
        time = 0;
        
        renderPuzzle();
        movesEl.textContent = `步数: ${moves}`;
        timeEl.textContent = `时间: ${time}s`;
    }
    
    // 渲染拼图
    function renderPuzzle() {
        container.innerHTML = '';
        puzzle.forEach((number, index) => {
            const piece = document.createElement('div');
            piece.className = `puzzle-piece ${number === '' ? 'empty' : ''}`;
            piece.dataset.index = index;
            piece.textContent = number;
            if (number !== '') {
                piece.addEventListener('click', handlePieceClick);
            }
            container.appendChild(piece);
        });
    }
    
    // 处理拼图块点击
    function handlePieceClick(e) {
        const piece = e.currentTarget;
        const index = parseInt(piece.dataset.index);
        
        if (canMove(index)) {
            // 移动拼图块
            puzzle[emptyIndex] = puzzle[index];
            puzzle[index] = '';
            emptyIndex = index;
            
            moves++;
            renderPuzzle();
            movesEl.textContent = `步数: ${moves}`;
            
            // 检查游戏完成
            if (isCompleted()) {
                endPuzzleGame();
            }
        }
    }
    
    // 检查是否可以移动
    function canMove(index) {
        const row = Math.floor(index / config.size);
        const col = index % config.size;
        const emptyRow = Math.floor(emptyIndex / config.size);
        const emptyCol = emptyIndex % config.size;
        
        return (Math.abs(row - emptyRow) + Math.abs(col - emptyCol)) === 1;
    }
    
    // 检查拼图是否完成
    function isCompleted() {
        for (let i = 0; i < puzzle.length - 1; i++) {
            if (puzzle[i] !== i + 1) {
                return false;
            }
        }
        return puzzle[puzzle.length - 1] === '';
    }
    
    // 检查拼图是否可解
    function isSolvable(puzzle) {
        let inversions = 0;
        for (let i = 0; i < puzzle.length; i++) {
            if (puzzle[i] === '') continue;
            for (let j = i + 1; j < puzzle.length; j++) {
                if (puzzle[j] === '') continue;
                if (puzzle[i] > puzzle[j]) {
                    inversions++;
                }
            }
        }
        return inversions % 2 === 0;
    }
    
    // 开始游戏
    function startPuzzleGame() {
        generatePuzzle();
        startBtn.disabled = true;
        resetBtn.disabled = false;
        
        timer = setInterval(() => {
            time++;
            timeEl.textContent = `时间: ${time}s`;
        }, 1000);
    }
    
    // 重置游戏
    function resetPuzzleGame() {
        clearInterval(timer);
        generatePuzzle();
        startBtn.disabled = false;
        resetBtn.disabled = true;
    }
    
    // 结束游戏
    function endPuzzleGame() {
        clearInterval(timer);
        startBtn.disabled = false;
        resetBtn.disabled = true;
        
        let rewardDraws = 0;
        if (moves <= 20) rewardDraws = 3;
        else if (moves <= 30) rewardDraws = 2;
        else rewardDraws = 1;
        
        showGameOver(moves, rewardDraws);
    }
    
    // 绑定事件
    startBtn.addEventListener('click', startPuzzleGame);
    resetBtn.addEventListener('click', resetPuzzleGame);
    
    // 初始化游戏
    generatePuzzle();
    resetBtn.disabled = true;
}

// 显示游戏结束弹窗
function showGameOver(score, rewardDraws) {
    const resultScore = document.getElementById('resultScore');
    const resultDraws = document.getElementById('resultDraws');
    
    resultScore.textContent = score;
    resultDraws.textContent = rewardDraws;
    
    // 增加抽奖次数
    gameState.drawCount += rewardDraws;
    
    // 增加得分
    gameState.score += score;
    
    // 检查升级
    checkLevelUp();
    
    // 更新UI
    updateUI();
    saveGameState();
    
    // 显示弹窗
    elements.gameOverModal.classList.add('active');
}

// 检查升级
function checkLevelUp() {
    const requiredScore = gameState.level * 100;
    if (gameState.score >= requiredScore) {
        gameState.level++;
        gameState.energy = gameState.maxEnergy;
        showMessage(`恭喜升级到 ${gameState.level} 级！`);
    }
}

// 前往抽奖界面
function goToDraw() {
    elements.gameOverModal.classList.remove('active');
    hideAllScreens();
    elements.drawScreen.style.display = 'block';
    updateUI();
}

// 开始抽奖
function startDraw() {
    if (gameState.drawCount <= 0) {
        showMessage('没有抽奖次数');
        return;
    }
    
    const prizeBox = document.querySelector('.prize-box');
    const prizeIcon = document.querySelector('.prize-icon');
    const prizeName = document.querySelector('.prize-name');
    
    // 减少抽奖次数
    gameState.drawCount--;
    updateUI();
    
    // 添加抽奖动画类
    prizeBox.classList.add('drawing');
    
    // 快速切换奖品显示
    let switchCount = 0;
    const maxSwitches = 20;
    const switchInterval = setInterval(() => {
        const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
        prizeIcon.textContent = randomPrize.icon;
        prizeName.textContent = randomPrize.name;
        switchCount++;
        
        if (switchCount >= maxSwitches) {
            clearInterval(switchInterval);
            finishDraw();
        }
    }, 100);
    
    // 完成抽奖
    function finishDraw() {
        // 根据概率抽取奖品
        const prize = drawByProbability();
        
        // 显示最终结果
        prizeIcon.textContent = prize.icon;
        prizeName.textContent = prize.name;
        
        // 移除动画类
        prizeBox.classList.remove('drawing');
        
        // 添加中奖特效
        createConfetti();
        
        // 显示中奖弹窗
        setTimeout(() => {
            showReward(prize);
            addToHistory(prize);
        }, 500);
    }
}

// 根据概率抽奖
function drawByProbability() {
    const random = Math.random();
    let cumulativeProbability = 0;
    
    for (const prize of prizes) {
        cumulativeProbability += prize.probability;
        if (random <= cumulativeProbability) {
            return prize;
        }
    }
    
    return prizes[prizes.length - 1];
}

// 显示中奖弹窗
function showReward(prize) {
    const rewardIcon = document.getElementById('rewardIcon');
    const rewardName = document.getElementById('rewardName');
    const rewardEffect = document.getElementById('rewardEffect');
    
    rewardIcon.textContent = prize.icon;
    rewardName.textContent = prize.name;
    rewardName.style.color = prize.color;
    
    // 显示特效文字
    rewardEffect.innerHTML = `<span style="color: ${prize.color}; font-size: 1.2rem; font-weight: bold;">恭喜获得 ${prize.name}！</span>`;
    
    // 显示再次抽奖按钮
    elements.modalRedraw.style.display = gameState.drawCount > 0 ? 'inline-block' : 'none';
    
    // 显示弹窗
    elements.modalOverlay.classList.add('active');
}

// 关闭弹窗
function closeModal() {
    elements.modalOverlay.classList.remove('active');
    elements.gameOverModal.classList.remove('active');
}

// 添加到历史记录
function addToHistory(prize) {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    const historyItem = {
        ...prize,
        time: timeString
    };
    
    gameState.history.unshift(historyItem);
    
    // 只保留最近10条记录
    if (gameState.history.length > 10) {
        gameState.history = gameState.history.slice(0, 10);
    }
    
    renderHistory();
    saveGameState();
}

// 渲染历史记录
function renderHistory() {
    if (gameState.history.length === 0) {
        elements.historyList.innerHTML = '<li class="history-empty">暂无记录</li>';
        return;
    }
    
    elements.historyList.innerHTML = gameState.history.map(item => `
        <li class="history-item">
            <span class="history-icon">${item.icon}</span>
            <div class="history-info">
                <div class="history-name">${item.name}</div>
                <div class="history-time">${item.time}</div>
            </div>
        </li>
    `).join('');
}

// 创建彩带特效
function createConfetti() {
    const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#00ffff', '#aa96da', '#f38181'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti confetti-animation';
            
            // 随机样式
            const color = colors[Math.floor(Math.random() * colors.length)];
            const left = Math.random() * 100;
            const size = Math.random() * 10 + 5;
            const duration = Math.random() * 2 + 2;
            
            confetti.style.cssText = `
                background: ${color};
                left: ${left}%;
                top: -20px;
                width: ${size}px;
                height: ${size}px;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                animation-duration: ${duration}s;
            `;
            
            document.body.appendChild(confetti);
            
            // 动画结束后移除
            setTimeout(() => {
                confetti.remove();
            }, duration * 1000);
        }, i * 30);
    }
}

// 显示消息
function showMessage(message) {
    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(messageEl);
    
    // 3秒后移除
    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            messageEl.remove();
        }, 300);
    }, 3000);
}

// 更新UI
function updateUI() {
    elements.userLevel.textContent = gameState.level;
    elements.energyFill.style.width = `${(gameState.energy / gameState.maxEnergy) * 100}%`;
    elements.energyText.textContent = `${gameState.energy}/${gameState.maxEnergy}`;
    elements.userScore.textContent = gameState.score;
    elements.drawCount.textContent = `抽奖次数: ${gameState.drawCount}`;
    
    // 禁用/启用抽奖按钮
    elements.drawBtn.disabled = gameState.drawCount <= 0;
}

// 保存游戏状态
function saveGameState() {
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

// 加载游戏状态
function loadGameState() {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
        Object.assign(gameState, JSON.parse(savedState));
    }
}

// 键盘事件处理
function handleKeyboard(e) {
    if (e.code === 'Escape') {
        closeModal();
        backToSelection();
    }
}

// 工具函数：打乱数组
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 能量恢复
setInterval(() => {
    if (gameState.energy < gameState.maxEnergy) {
        gameState.energy += 1;
        updateUI();
        saveGameState();
    }
}, 60000); // 每分钟恢复1点能量

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
