// 时间显示功能

// 当前时间显示功能
function updateDateTime() {
    const now = new Date();
    
    // 格式化时间
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    // 格式化日期
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[now.getDay()];
    const dateString = `${year}年${month}月${day}日 ${weekday}`;
    
    // 更新DOM
    document.getElementById('current-time').textContent = timeString;
    document.getElementById('current-date').textContent = dateString;
}

// 更新时钟指针位置
function updateClock() {
    const now = new Date();
    
    // 获取秒针角度 (6度/秒)
    const secondsRatio = now.getSeconds() / 60;
    const secondsDegrees = (secondsRatio * 360);
    
    // 获取分针角度 (6度/分钟 + 秒针对分针的影响)
    const minutesRatio = (now.getMinutes() + secondsRatio) / 60;
    const minutesDegrees = (minutesRatio * 360);
    
    // 获取时针角度 (30度/小时 + 分针对时针的影响)
    const hoursRatio = (now.getHours() % 12 + minutesRatio) / 12;
    const hoursDegrees = (hoursRatio * 360);
    
    // 设置指针旋转角度
    document.getElementById('second-hand').style.transform = `rotate(${secondsDegrees}deg)`;
    document.getElementById('minute-hand').style.transform = `rotate(${minutesDegrees}deg)`;
    document.getElementById('hour-hand').style.transform = `rotate(${hoursDegrees}deg)`;
}

// 初始化时间显示并设置定时器
updateDateTime();
updateClock();
setInterval(updateDateTime, 1000);
setInterval(updateClock, 1000);

// Todo List 功能
let todoItems = JSON.parse(localStorage.getItem('todoItems')) || [];
let currentEngine = localStorage.getItem('currentEngine') || 'baidu';

// 保存Todo到本地存储
function saveTodos() {
    localStorage.setItem('todoItems', JSON.stringify(todoItems));
}

// 渲染Todo列表
function renderTodos() {
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';
    
    todoItems.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.draggable = true;
        li.dataset.index = index;
        
        li.innerHTML = `
            <span class="drag-handle">⋮⋮</span>
            <input type="checkbox" class="todo-checkbox" data-index="${index}" ${item.completed ? 'checked' : ''}>
            <span class="todo-text ${item.completed ? 'completed' : ''}">${item.text}</span>
            <button class="delete-todo" data-index="${index}">删除</button>
        `;
        
        // 添加拖拽事件监听
        li.addEventListener('dragstart', handleTodoDragStart);
        li.addEventListener('dragover', handleTodoDragOver);
        li.addEventListener('drop', handleTodoDrop);
        li.addEventListener('dragend', handleTodoDragEnd);
        
        todoList.appendChild(li);
    });
    
    // 添加事件监听器
    document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', toggleTodo);
    });
    
    document.querySelectorAll('.delete-todo').forEach(button => {
        button.addEventListener('click', deleteTodo);
    });
}

// 拖拽变量
let draggedTodoIndex = null;
let draggedWebsiteIndex = null;

// Todo拖拽开始
function handleTodoDragStart(e) {
    draggedTodoIndex = parseInt(this.dataset.index);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

// Todo拖拽经过
function handleTodoDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

// Todo拖拽放置
function handleTodoDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(this.dataset.index);
    
    // 移除所有drag-over类
    document.querySelectorAll('.todo-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    
    if (draggedTodoIndex !== null && draggedTodoIndex !== targetIndex) {
        // 获取拖拽的项
        const draggedItem = todoItems[draggedTodoIndex];
        
        // 从原位置移除
        todoItems.splice(draggedTodoIndex, 1);
        
        // 插入到新位置
        todoItems.splice(targetIndex, 0, draggedItem);
        
        // 保存并重新渲染
        saveTodos();
        renderTodos();
    }
}

// Todo拖拽结束
function handleTodoDragEnd() {
    draggedTodoIndex = null;
    document.querySelectorAll('.todo-item').forEach(item => {
        item.classList.remove('dragging', 'drag-over');
    });
}

// 添加新的Todo
function addTodo() {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    
    if (text) {
        todoItems.push({ text, completed: false });
        saveTodos();
        renderTodos();
        input.value = '';
    }
}

// 切换Todo完成状态
function toggleTodo(e) {
    const index = parseInt(e.target.dataset.index);
    todoItems[index].completed = e.target.checked;
    saveTodos();
    renderTodos();
}

// 删除Todo
function deleteTodo(e) {
    const index = parseInt(e.target.dataset.index);
    todoItems.splice(index, 1);
    saveTodos();
    renderTodos();
}

// 搜索引擎功能
function search(query, engine = 'baidu') {
    let url = '';
    
    switch (engine) {
        case 'baidu':
            url = `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`;
            break;
        case 'google':
            url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            break;
        case 'bing':
            url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
            break;
    }
    
    // 保存搜索历史
    saveSearchHistory(query, engine);
    
    window.open(url, '_blank');
}

// 保存搜索历史
function saveSearchHistory(query, engine) {
    let history = getSearchHistory();
    
    // 如果已存在相同的搜索记录，则移除旧记录
    history = history.filter(item => item.query !== query || item.engine !== engine);
    
    // 添加新记录到开头
    history.unshift({
        query,
        engine,
        timestamp: new Date().getTime()
    });
    
    // 只保留最近20条记录
    if (history.length > 20) {
        history = history.slice(0, 20);
    }
    
    localStorage.setItem('searchHistory', JSON.stringify(history));
    
    // 更新历史记录显示
    displaySearchHistory();
}

// 获取搜索历史
function getSearchHistory() {
    const history = localStorage.getItem('searchHistory');
    return history ? JSON.parse(history) : [];
}

// 显示搜索历史
function displaySearchHistory() {
    const history = getSearchHistory();
    const historyList = document.getElementById('history-list');
    
    if (!historyList) return;
    
    // 清空历史记录列表
    historyList.innerHTML = '';
    
    // 如果没有历史记录，显示提示信息
    if (history.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'history-empty';
        emptyMsg.textContent = '暂无搜索历史';
        historyList.appendChild(emptyMsg);
        return;
    }
    
    // 创建历史记录项
    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const engineTag = document.createElement('span');
        engineTag.className = 'engine-tag';
        engineTag.textContent = item.engine;
        
        const queryText = document.createElement('span');
        queryText.className = 'history-query';
        queryText.textContent = item.query;
        
        historyItem.appendChild(engineTag);
        historyItem.appendChild(queryText);
        
        // 添加点击事件
        historyItem.addEventListener('click', () => {
            search(item.query, item.engine);
        });
        
        historyList.appendChild(historyItem);
    });
}

// 清空搜索历史
function clearSearchHistory() {
    localStorage.removeItem('searchHistory');
    displaySearchHistory();
}

// 切换搜索引擎
function setSearchEngine(engine) {
    currentEngine = engine;
    localStorage.setItem('currentEngine', engine);
    
    // 更新按钮状态
    document.querySelectorAll('.engine-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.engine === engine) {
            btn.classList.add('active');
        }
    });
}

// 常用网站数据 - 从localStorage加载或使用默认值
let websites = JSON.parse(localStorage.getItem('websites')) || [
    { name: 'Kimi', url: 'https://www.kimi.com/', icon: '🔍' },
    { name: 'DeepSeek', url: 'https://www.deepseek.com/', icon: '🌐' },
    { name: 'B站', url: 'https://www.bilibili.com', icon: '📺' },
    { name: 'GitHub', url: 'https://www.github.com', icon: '💻' },
    { name: '抖音', url: 'https://www.douyin.com', icon: '🎵' },
    { name: '小红书', url: 'https://www.xiaohongshu.com', icon: '🛒' },
    { name: '网易邮箱', url: 'https://mail.163.com/', icon: '📱' },
    { name: '思霖的诗词格律自学手册', url: 'https://silinsgh.github.io/Silinsweb/', icon: '❓' }
];

// 保存网站到localStorage
function saveWebsites() {
    localStorage.setItem('websites', JSON.stringify(websites));
}

// 删除网站
function deleteWebsite(index) {
    if (confirm('确定要删除这个网站吗？')) {
        websites.splice(index, 1);
        saveWebsites();
        renderWebsites();
    }
}

// 渲染常用网站
function renderWebsites() {
    const container = document.getElementById('websites-grid');
    container.innerHTML = ''; // 清空容器
    
    websites.forEach((site, index) => {
        const item = document.createElement('div');
        item.className = 'website-item';
        item.draggable = true;
        item.dataset.index = index;
        
        const linkContainer = document.createElement('div');
        linkContainer.innerHTML = `
            <span class="drag-handle">⋮⋮</span>
            <div class="website-icon">${site.icon}</div>
            <div class="website-name">${site.name}</div>
        `;
        
        // 添加拖拽事件监听
        item.addEventListener('dragstart', handleWebsiteDragStart);
        item.addEventListener('dragover', handleWebsiteDragOver);
        item.addEventListener('drop', handleWebsiteDrop);
        item.addEventListener('dragend', handleWebsiteDragEnd);
        
        linkContainer.addEventListener('click', () => {
            window.open(site.url, '_blank');
        });
        
        // 添加删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-site-btn';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteWebsite(index);
        });
        
        item.appendChild(linkContainer);
        item.appendChild(deleteBtn);
        container.appendChild(item);
    });
}

// 网站拖拽开始
function handleWebsiteDragStart(e) {
    draggedWebsiteIndex = parseInt(this.dataset.index);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

// 网站拖拽经过
function handleWebsiteDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

// 网站拖拽放置
function handleWebsiteDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(this.dataset.index);
    
    // 移除所有drag-over类
    document.querySelectorAll('.website-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    
    if (draggedWebsiteIndex !== null && draggedWebsiteIndex !== targetIndex) {
        // 获取拖拽的项
        const draggedItem = websites[draggedWebsiteIndex];
        
        // 从原位置移除
        websites.splice(draggedWebsiteIndex, 1);
        
        // 插入到新位置
        websites.splice(targetIndex, 0, draggedItem);
        
        // 保存并重新渲染
        saveWebsites();
        renderWebsites();
    }
}

// 网站拖拽结束
function handleWebsiteDragEnd() {
    draggedWebsiteIndex = null;
    document.querySelectorAll('.website-item').forEach(item => {
        item.classList.remove('dragging', 'drag-over');
    });
}

// 模态框控制
function initModal() {
    const modal = document.getElementById('add-website-modal');
    const addWebsiteBtn = document.getElementById('add-website-btn');
    const closeModal = document.querySelector('.close-modal');
    const addWebsiteForm = document.getElementById('add-website-form');
    
    // 打开模态框
    addWebsiteBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });
    
    // 关闭模态框
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        addWebsiteForm.reset();
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            addWebsiteForm.reset();
        }
    });
    
    // 添加新网站
    addWebsiteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('website-name').value.trim();
        let url = document.getElementById('website-url').value.trim();
        let icon = document.getElementById('website-icon').value.trim();
        
        // 验证输入
        if (!name || !url) {
            alert('请填写网站名称和URL');
            return;
        }
        
        // 确保URL以http或https开头
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        // 如果没有提供图标，使用网站名称的第一个字符或默认图标
        if (!icon) {
            icon = '🌐'; // 默认图标
        }
        
        // 添加新网站
        websites.push({ name, url, icon });
        saveWebsites();
        renderWebsites();
        
        // 关闭模态框并重置表单
        modal.style.display = 'none';
        addWebsiteForm.reset();
    });
}

// 事件监听器
function initEventListeners() {
    // Todo List 事件
    document.getElementById('add-todo').addEventListener('click', addTodo);
    document.getElementById('todo-input').addEventListener('keypress', e => {
        if (e.key === 'Enter') addTodo();
    });
    
    // 搜索引擎事件
    document.getElementById('search-form').addEventListener('submit', e => {
        e.preventDefault();
        const query = document.getElementById('search-input').value.trim();
        if (query) {
            search(query);
            document.getElementById('search-input').value = '';
        }
    });
    
    // 搜索引擎切换按钮
    document.querySelectorAll('.engine-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setSearchEngine(btn.dataset.engine);
        });
    });
    
    // 初始化清空历史按钮
    const clearHistoryBtn = document.getElementById('clear-history');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearSearchHistory);
    }
    
    // 显示搜索历史
    displaySearchHistory();
}

// 初始化应用
function init() {
    // 渲染初始数据
    renderTodos();
    renderWebsites();
    setSearchEngine(currentEngine);
    
    // 初始化事件监听器
    initEventListeners();
    
    // 初始化模态框控制
    initModal();
}

// 启动应用
init();
