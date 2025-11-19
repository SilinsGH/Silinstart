// Vue应用的主入口文件
const { createApp, ref, computed, onMounted, onUnmounted, watch, provide } = Vue;

// 时间显示组件
const TimeComponent = {
  template: `
    <div class="time-section">
      <div class="clock-container">
        <div class="clock">
          <div class="clock-face">
            <!-- 时钟刻度 -->
            <div class="clock-mark hour-mark mark-1"></div>
            <div class="clock-mark hour-mark mark-2"></div>
            <div class="clock-mark hour-mark mark-3"></div>
            <div class="clock-mark hour-mark mark-4"></div>
            <div class="clock-mark hour-mark mark-5"></div>
            <div class="clock-mark hour-mark mark-6"></div>
            <div class="clock-mark hour-mark mark-7"></div>
            <div class="clock-mark hour-mark mark-8"></div>
            <div class="clock-mark hour-mark mark-9"></div>
            <div class="clock-mark hour-mark mark-10"></div>
            <div class="clock-mark hour-mark mark-11"></div>
            <div class="clock-mark hour-mark mark-12"></div>
            <!-- 时钟指针 -->
            <div class="clock-hand hour-hand" :style="{ transform: 'rotate(' + hoursDegrees + 'deg)' }"></div>
            <div class="clock-hand minute-hand" :style="{ transform: 'rotate(' + minutesDegrees + 'deg)' }"></div>
            <div class="clock-hand second-hand" :style="{ transform: 'rotate(' + secondsDegrees + 'deg)' }"></div>
            <!-- 时钟中心点 -->
            <div class="clock-center"></div>
          </div>
        </div>
      </div>
      <div id="current-time">{{ currentTime }}</div>
      <div id="current-date">{{ currentDate }}</div>
    </div>
  `,
  setup() {
    const currentTime = ref('');
    const currentDate = ref('');
    const hoursDegrees = ref(0);
    const minutesDegrees = ref(0);
    const secondsDegrees = ref(0);

    // 更新时间显示
    const updateDateTime = () => {
      const now = new Date();
      
      // 格式化时间
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      currentTime.value = `${hours}:${minutes}:${seconds}`;
      
      // 格式化日期
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekday = weekdays[now.getDay()];
      currentDate.value = `${year}年${month}月${day}日 ${weekday}`;
    };

    // 更新时钟指针位置
    const updateClock = () => {
      const now = new Date();
      
      // 获取秒针角度 (6度/秒)
      const secondsRatio = now.getSeconds() / 60;
      secondsDegrees.value = secondsRatio * 360;
      
      // 获取分针角度 (6度/分钟 + 秒针对分针的影响)
      const minutesRatio = (now.getMinutes() + secondsRatio) / 60;
      minutesDegrees.value = minutesRatio * 360;
      
      // 获取时针角度 (30度/小时 + 分针对时针的影响)
      const hoursRatio = (now.getHours() % 12 + minutesRatio) / 12;
      hoursDegrees.value = hoursRatio * 360;
    };

    onMounted(() => {
      updateDateTime();
      updateClock();
      setInterval(updateDateTime, 1000);
      setInterval(updateClock, 1000);
    });

    return {
      currentTime,
      currentDate,
      hoursDegrees,
      minutesDegrees,
      secondsDegrees
    };
  }
};

// 番茄钟组件
const PomodoroComponent = {
  template: `
    <div class="pomodoro-section">
      <div class="pomodoro-header">
        <h4>番茄钟</h4>
        <div class="pomodoro-status" :class="currentMode">
          {{ currentMode === 'work' ? '工作中' : '休息中' }}
        </div>
      </div>
      
      <div class="pomodoro-timer">
        <div class="timer-display">{{ formattedTime }}</div>
        <div class="timer-progress">
          <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
        </div>
      </div>
      
      <div class="pomodoro-controls">
        <button 
          class="control-btn start-btn" 
          @click="toggleTimer"
          :disabled="isRunning"
        >
          开始
        </button>
        <button 
          class="control-btn pause-btn" 
          @click="pauseTimer"
          :disabled="!isRunning"
        >
          暂停
        </button>
        <button 
          class="control-btn reset-btn" 
          @click="resetTimer"
        >
          重置
        </button>
        <button 
          class="control-btn mode-btn" 
          :class="currentMode"
          @click="switchMode"
        >
          {{ currentMode === 'work' ? '切换休息' : '切换工作' }}
        </button>
      </div>
      
      <div class="pomodoro-settings">
        <div class="setting-group">
          <label>工作时长(分钟):</label>
          <input type="number" v-model.number="workMinutes" min="1" max="60" @change="updateWorkTime">
        </div>
        <div class="setting-group">
          <label>休息时长(分钟):</label>
          <input type="number" v-model.number="breakMinutes" min="1" max="30" @change="updateBreakTime">
        </div>
      </div>
    </div>
  `,
  setup() {
    // 从本地存储加载设置
    const loadSettings = () => {
      const saved = localStorage.getItem('pomodoroSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings;
      }
      return {
        workMinutes: 25,
        breakMinutes: 5,
        currentMode: 'work'
      };
    };

    const settings = loadSettings();
    const currentMode = ref(settings.currentMode || 'work'); // 'work' 或 'break'
    const isRunning = ref(false);
    const workMinutes = ref(settings.workMinutes || 25);
    const breakMinutes = ref(settings.breakMinutes || 5);
    
    // 初始化时间
    const timeLeft = ref(currentMode.value === 'work' ? workMinutes.value * 60 : breakMinutes.value * 60);
    const totalTime = ref(timeLeft.value);
    let timerInterval = null;

    // 保存设置到本地存储
    const saveSettings = () => {
      const settingsToSave = {
        workMinutes: workMinutes.value,
        breakMinutes: breakMinutes.value,
        currentMode: currentMode.value
      };
      localStorage.setItem('pomodoroSettings', JSON.stringify(settingsToSave));
    };

    // 格式化时间显示
    const formattedTime = computed(() => {
      const minutes = Math.floor(timeLeft.value / 60);
      const seconds = timeLeft.value % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    });

    // 计算进度百分比
    const progressPercentage = computed(() => {
      return ((totalTime.value - timeLeft.value) / totalTime.value) * 100;
    });

    // 更新工作时间
    const updateWorkTime = () => {
      if (currentMode.value === 'work' && !isRunning.value) {
        totalTime.value = workMinutes.value * 60;
        timeLeft.value = workMinutes.value * 60;
      }
      saveSettings();
    };

    // 更新休息时间
    const updateBreakTime = () => {
      if (currentMode.value === 'break' && !isRunning.value) {
        totalTime.value = breakMinutes.value * 60;
        timeLeft.value = breakMinutes.value * 60;
      }
      saveSettings();
    };

    // 开始或继续计时
    const toggleTimer = () => {
      if (!isRunning.value) {
        isRunning.value = true;
        timerInterval = setInterval(() => {
          if (timeLeft.value > 0) {
            timeLeft.value--;
          } else {
            // 时间到，切换模式
            switchMode();
          }
        }, 1000);
      }
    };

    // 暂停计时
    const pauseTimer = () => {
      if (isRunning.value) {
        isRunning.value = false;
        clearInterval(timerInterval);
      }
    };

    // 重置计时
    const resetTimer = () => {
      pauseTimer();
      if (currentMode.value === 'work') {
        timeLeft.value = workMinutes.value * 60;
        totalTime.value = workMinutes.value * 60;
      } else {
        timeLeft.value = breakMinutes.value * 60;
        totalTime.value = breakMinutes.value * 60;
      }
    };

    // 切换模式
    const switchMode = () => {
      pauseTimer();
      currentMode.value = currentMode.value === 'work' ? 'break' : 'work';
      resetTimer();
      saveSettings();
    };

    onUnmounted(() => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    });

    return {
      currentMode,
      isRunning,
      timeLeft,
      workMinutes,
      breakMinutes,
      formattedTime,
      progressPercentage,
      toggleTimer,
      pauseTimer,
      resetTimer,
      switchMode,
      updateWorkTime,
      updateBreakTime
    };
  }
};

// TodoList组件
const TodoListComponent = {
  components: {
    PomodoroComponent
  },
  template: `
    <div class="todo-section">
      <div class="todo-header">
        <h3>Todo List</h3>
        <PomodoroComponent />
      </div>
      <div class="todo-input-area">
        <div class="todo-input-group">
          <input 
            type="text" 
            id="todo-input"
            v-model="newTodoText" 
            placeholder="添加新任务..." 
            autocomplete="off"
            @keyup.enter="addTodo"
          >
          <select v-model="newTodoPriority" class="priority-select">
            <option value="low">低优先级</option>
            <option value="medium" selected>中优先级</option>
            <option value="high">高优先级</option>
            <option value="urgent">紧急</option>
          </select>
          <button id="add-todo" @click="addTodo">添加</button>
        </div>
      </div>
      <ul id="todo-list" class="todo-list">
        <!-- 空列表提示 -->
        <li v-if="todoItems.length === 0" class="empty-todo-message">
          暂无任务，去添加一个吧～
        </li>
        <!-- Todo 项 -->
        <li 
          v-for="(item, index) in todoItems" 
          :key="index"
          class="todo-item"
          :data-index="index"
          :data-priority="item.priority || 'medium'"
          draggable="true"
          @dragstart="handleTodoDragStart(index)"
          @dragover.prevent
          @drop="handleTodoDrop(index)"
          @dragend="handleTodoDragEnd"
        >
          <span class="drag-handle">⋮⋮</span>
          <input 
            type="checkbox" 
            class="todo-checkbox"
            :checked="item.completed"
            @change="toggleTodo(index)"
          >
          <span class="todo-text" :class="{ completed: item.completed }">
            {{ item.text }}
            <span class="priority-tag" :class="'priority-' + (item.priority || 'medium')">
              {{ getPriorityName(item.priority || 'medium') }}
            </span>
          </span>
          <button class="delete-todo" @click="deleteTodo(index)">删除</button>
        </li>
      </ul>
    </div>
  `,
  setup() {
    // 从localStorage加载数据或使用默认值
    const todoItems = ref(JSON.parse(localStorage.getItem('todoItems')) || []);
    const newTodoText = ref('');
    const newTodoPriority = ref('medium');
    let draggedTodoIndex = null;

    // 优先级名称映射
    const priorityNames = {
      low: '低优先级',
      medium: '中优先级',
      high: '高优先级',
      urgent: '紧急'
    };

    // 保存Todo到本地存储
    const saveTodos = () => {
      localStorage.setItem('todoItems', JSON.stringify(todoItems.value));
    };

    // 获取优先级名称
    const getPriorityName = (priority) => {
      return priorityNames[priority] || '中优先级';
    };

    // 添加新的Todo
    const addTodo = () => {
      if (newTodoText.value.trim()) {
        todoItems.value.push({
          text: newTodoText.value.trim(),
          completed: false,
          priority: newTodoPriority.value
        });
        saveTodos();
        newTodoText.value = '';
      }
    };

    // 切换Todo完成状态
    const toggleTodo = (index) => {
      todoItems.value[index].completed = !todoItems.value[index].completed;
      saveTodos();
    };

    // 删除Todo
    const deleteTodo = (index) => {
      todoItems.value.splice(index, 1);
      saveTodos();
    };

    // Todo拖拽开始
    const handleTodoDragStart = (index) => {
      draggedTodoIndex = index;
      setTimeout(() => {
        event.target.classList.add('dragging');
      }, 0);
    };

    // Todo拖拽放置
    const handleTodoDrop = (targetIndex) => {
      if (draggedTodoIndex !== null && draggedTodoIndex !== targetIndex) {
        // 获取拖拽的项
        const draggedItem = todoItems.value[draggedTodoIndex];
        
        // 从原位置移除
        todoItems.value.splice(draggedTodoIndex, 1);
        
        // 插入到新位置
        todoItems.value.splice(targetIndex, 0, draggedItem);
        
        // 保存
        saveTodos();
      }
      
      // 移除所有drag-over类
      document.querySelectorAll('.todo-item').forEach(item => {
        item.classList.remove('drag-over', 'dragging');
      });
    };

    // Todo拖拽结束
    const handleTodoDragEnd = () => {
      draggedTodoIndex = null;
      document.querySelectorAll('.todo-item').forEach(item => {
        item.classList.remove('dragging', 'drag-over');
      });
    };

    return {
      todoItems,
      newTodoText,
      newTodoPriority,
      addTodo,
      toggleTodo,
      deleteTodo,
      handleTodoDragStart,
      handleTodoDrop,
      handleTodoDragEnd,
      getPriorityName
    };
  }
};

// 搜索组件
const SearchComponent = {
  template: `
    <div class="search-section">
      <form @submit.prevent="handleSearch" class="search-form">
        <input 
          type="text" 
          id="search-input"
          v-model="searchQuery" 
          placeholder="搜索..." 
          autocomplete="off"
        >
        <button type="submit" class="search-button">搜索</button>
      </form>
      <div class="search-engines">
        <button 
          v-for="engine in searchEngines" 
          :key="engine.id"
          class="engine-btn"
          :class="{ active: currentEngine === engine.id }"
          :data-engine="engine.id"
          @click="setSearchEngine(engine.id)"
        >
          {{ engine.name }}
        </button>
      </div>
      <!-- 搜索历史记录 -->
      <div class="search-history">
        <div class="history-header">
          <span>搜索历史</span>
          <button id="clear-history" class="clear-history-btn" @click="clearSearchHistory">清空</button>
        </div>
        <div id="history-list" class="history-list">
          <!-- 搜索历史记录将在这里动态显示 -->
          <div v-if="searchHistory.length === 0" class="history-empty">暂无搜索历史</div>
          <div 
            v-for="(item, index) in searchHistory" 
            :key="index"
            class="history-item"
            @click="search(item.query, item.engine)"
          >
            <span class="engine-tag">{{ item.engine }}</span>
            <span class="history-query">{{ item.query }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const searchQuery = ref('');
    const currentEngine = ref(localStorage.getItem('currentEngine') || 'baidu');
    const searchHistory = ref(getSearchHistory());
    
    const searchEngines = [
      { id: 'baidu', name: '百度' },
      { id: 'google', name: 'Google' },
      { id: 'bing', name: 'Bing' }
    ];

    // 获取搜索历史
    function getSearchHistory() {
      const history = localStorage.getItem('searchHistory');
      return history ? JSON.parse(history) : [];
    }

    // 搜索功能
    const search = (query, engine = 'baidu') => {
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
    };

    // 处理搜索表单提交
    const handleSearch = () => {
      if (searchQuery.value.trim()) {
        search(searchQuery.value, currentEngine.value);
        searchQuery.value = '';
      }
    };

    // 保存搜索历史
    const saveSearchHistory = (query, engine) => {
      // 如果已存在相同的搜索记录，则移除旧记录
      searchHistory.value = searchHistory.value.filter(item => item.query !== query || item.engine !== engine);
      
      // 添加新记录到开头
      searchHistory.value.unshift({
        query,
        engine,
        timestamp: new Date().getTime()
      });
      
      // 只保留最近20条记录
      if (searchHistory.value.length > 20) {
        searchHistory.value = searchHistory.value.slice(0, 20);
      }
      
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value));
    };

    // 清空搜索历史
    const clearSearchHistory = () => {
      localStorage.removeItem('searchHistory');
      searchHistory.value = [];
    };

    // 切换搜索引擎
    const setSearchEngine = (engine) => {
      currentEngine.value = engine;
      localStorage.setItem('currentEngine', engine);
    };

    return {
      searchQuery,
      currentEngine,
      searchHistory,
      searchEngines,
      handleSearch,
      clearSearchHistory,
      setSearchEngine,
      search
    };
  }
};

// 常用网站组件
// 便签栏组件 - 灵光一现
const StickyNotesComponent = {
  template: `
    <div 
      class="sticky-notes-section"
      :class="{ 'show': isVisible }"
      @mouseenter="showNotes"
      @mouseleave="hideNotes"
    >
      <!-- 便签栏触发器 -->
      <div class="notes-trigger">
        <span>灵光一现</span>
      </div>
      
      <!-- 便签栏内容 -->
      <div class="notes-content">
        <div class="notes-header">
          <button class="add-note-btn" @click="addNewNote">+ 新建便签</button>
        </div>
        
        <div class="notes-container">
          <div v-if="notes.length === 0" class="empty-notes">
            暂无便签，点击添加按钮创建
          </div>
          <div 
            v-for="(note, index) in notes" 
            :key="index"
            class="note-item"
          >
            <div class="note-header">
              <span class="note-date">{{ formatDate(note.createdAt) }}</span>
              <button class="delete-note-btn" @click="deleteNote(index)">×</button>
            </div>
            <textarea 
              v-model="note.content"
              class="note-textarea"
              placeholder="输入你的想法..."
              @input="updateNote(index)"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const isVisible = ref(false);
    
    // 显示便签栏
    const showNotes = () => {
      isVisible.value = true;
    };
    
    // 隐藏便签栏
    const hideNotes = () => {
      isVisible.value = false;
    };
    
    // 格式化日期
    const formatDate = (timestamp) => {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    };
    
    // 初始化便签数据 - 后续会从本地存储加载
    const notes = ref([]);
    
    // 添加新便签
    const addNewNote = () => {
      const newNote = {
        content: '',
        createdAt: Date.now()
      };
      notes.value.unshift(newNote);
      saveNotesToStorage();
    };
    
    // 删除便签
    const deleteNote = (index) => {
      notes.value.splice(index, 1);
      saveNotesToStorage();
    };
    
    // 更新便签
    const updateNote = (index) => {
      saveNotesToStorage();
    };
    
    // 保存便签到本地存储
    const saveNotesToStorage = () => {
      localStorage.setItem('stickyNotes', JSON.stringify(notes.value));
    };
    
    // 从本地存储加载便签
    const loadNotesFromStorage = () => {
      const savedNotes = localStorage.getItem('stickyNotes');
      if (savedNotes) {
        try {
          notes.value = JSON.parse(savedNotes);
        } catch (error) {
          console.error('加载便签数据失败:', error);
        }
      }
    };
    
    // 组件挂载时加载数据
    onMounted(() => {
      loadNotesFromStorage();
    });
    
    return {
      isVisible,
      notes,
      showNotes,
      hideNotes,
      formatDate,
      addNewNote,
      deleteNote,
      updateNote
    };
  }
};

const WebsitesComponent = {
  template: `
    <div class="websites-section">
      <div class="section-header">
        <h3>常用网站</h3>
        <button id="add-website-btn" class="add-website-btn" @click="openModal">+ 添加</button>
      </div>
      <div class="websites-grid" id="websites-grid">
        <div 
          v-for="(site, index) in websites" 
          :key="index"
          class="website-item"
          :data-index="index"
          draggable="true"
          @dragstart="handleWebsiteDragStart(index)"
          @dragover.prevent
          @drop="handleWebsiteDrop(index)"
          @dragend="handleWebsiteDragEnd"
        >
          <div @click="openWebsite(site.url)">
            <span class="drag-handle">⋮⋮</span>
            <div class="website-icon">{{ site.icon }}</div>
            <div class="website-name">{{ site.name }}</div>
          </div>
          <div class="delete-btn-container" @mouseenter="showDeleteBtn(index)" @mouseleave="hideDeleteBtn(index)">
            <button 
              v-if="hoveredIndex === index"
              class="delete-site-btn" 
              @click.stop="confirmDeleteWebsite(index)"
            >×</button>
          </div>
        </div>
      </div>

      <!-- 添加网站模态框 -->
      <div id="add-website-modal" class="modal" :style="{ display: modalVisible ? 'block' : 'none' }">
        <div class="modal-content">
          <span class="close-modal" @click="closeModal">&times;</span>
          <h3>添加新网站</h3>
          <form id="add-website-form" @submit.prevent="addWebsite">
            <div class="form-group">
              <label for="website-name">网站名称</label>
              <input type="text" v-model="newWebsite.name" id="website-name" placeholder="例如：百度">
            </div>
            <div class="form-group">
              <label for="website-url">网站URL</label>
              <input type="text" v-model="newWebsite.url" id="website-url" placeholder="例如：https://www.baidu.com">
            </div>
            <div class="form-group">
              <label for="website-icon">网站图标</label>
              <input type="text" v-model="newWebsite.icon" id="website-icon" placeholder="例如：🔍 或 百">
            </div>
            <button type="submit" class="save-website-btn">保存</button>
          </form>
        </div>
      </div>
    </div>
  `,
  setup() {
    // 从localStorage加载数据或使用默认值
    const websites = ref(JSON.parse(localStorage.getItem('websites')) || [
      { name: 'Kimi', url: 'https://www.kimi.com/', icon: '🔍' },
      { name: 'DeepSeek', url: 'https://chat.deepseek.com/', icon: '🌐' },
      { name: 'B站', url: 'https://www.bilibili.com', icon: '📺' },
      { name: 'GitHub', url: 'https://github.com/', icon: '💻' },
      { name: '抖音', url: 'https://www.douyin.com', icon: '🎵' },
      { name: '小红书', url: 'https://www.xiaohongshu.com', icon: '🛒' },
      { name: '网易邮箱', url: 'https://mail.163.com/', icon: '📱' },
      { name: '思霖的诗词格律学习手册', url: 'https://silinsgh.github.io/Silinsweb/', icon: '❓' }
    ]);
    
    const modalVisible = ref(false);
    const newWebsite = ref({
      name: '',
      url: '',
      icon: ''
    });
    
    let draggedWebsiteIndex = null;
    const hoveredIndex = ref(-1);

    // 保存网站到localStorage
    const saveWebsites = () => {
      localStorage.setItem('websites', JSON.stringify(websites.value));
    };

    // 打开模态框
    const openModal = () => {
      modalVisible.value = true;
    };

    // 关闭模态框
    const closeModal = () => {
      modalVisible.value = false;
      resetNewWebsite();
    };

    // 显示删除按钮
    const showDeleteBtn = (index) => {
      hoveredIndex.value = index;
    };

    // 隐藏删除按钮
    const hideDeleteBtn = () => {
      hoveredIndex.value = -1;
    };

    // 确认删除网站
    const confirmDeleteWebsite = (index) => {
      if (confirm('确定要删除这个网站吗？')) {
        deleteWebsite(index);
      }
    };

    // 重置新网站表单
    const resetNewWebsite = () => {
      newWebsite.value = {
        name: '',
        url: '',
        icon: ''
      };
    };

    // 添加新网站
    const addWebsite = () => {
      // 验证输入
      if (!newWebsite.value.name.trim() || !newWebsite.value.url.trim()) {
        alert('请填写网站名称和URL');
        return;
      }

      let url = newWebsite.value.url.trim();
      let icon = newWebsite.value.icon.trim();
      
      // 确保URL以http或https开头
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // 如果没有提供图标，使用网站名称的第一个字符或默认图标
      if (!icon) {
        icon = '🌐'; // 默认图标
      }
      
      // 添加新网站
      websites.value.push({
        name: newWebsite.value.name.trim(),
        url: url,
        icon: icon
      });
      
      saveWebsites();
      closeModal();
    };

    // 打开网站
    const openWebsite = (url) => {
      window.open(url, '_blank');
    };

    // 删除网站
    const deleteWebsite = (index) => {
      if (confirm('确定要删除这个网站吗？')) {
        websites.value.splice(index, 1);
        saveWebsites();
      }
    };

    // 网站拖拽开始
    const handleWebsiteDragStart = (index) => {
      draggedWebsiteIndex = index;
      setTimeout(() => {
        event.target.classList.add('dragging');
      }, 0);
    };

    // 网站拖拽放置
    const handleWebsiteDrop = (targetIndex) => {
      if (draggedWebsiteIndex !== null && draggedWebsiteIndex !== targetIndex) {
        // 获取拖拽的项
        const draggedItem = websites.value[draggedWebsiteIndex];
        
        // 从原位置移除
        websites.value.splice(draggedWebsiteIndex, 1);
        
        // 插入到新位置
        websites.value.splice(targetIndex, 0, draggedItem);
        
        // 保存
        saveWebsites();
      }
      
      // 移除所有drag-over类
      document.querySelectorAll('.website-item').forEach(item => {
        item.classList.remove('drag-over', 'dragging');
      });
    };

    // 网站拖拽结束
    const handleWebsiteDragEnd = () => {
      draggedWebsiteIndex = null;
      document.querySelectorAll('.website-item').forEach(item => {
        item.classList.remove('dragging', 'drag-over');
      });
    };

    // 点击模态框外部关闭
    const handleClickOutside = (event) => {
      const modal = document.getElementById('add-website-modal');
      if (modal && event.target === modal) {
        closeModal();
      }
    };

    onMounted(() => {
      window.addEventListener('click', handleClickOutside);
    });

    return {
      websites,
      modalVisible,
      newWebsite,
      hoveredIndex,
      openModal,
      closeModal,
      addWebsite,
      openWebsite,
      deleteWebsite,
      confirmDeleteWebsite,
      handleWebsiteDragStart,
      handleWebsiteDrop,
      handleWebsiteDragEnd,
      showDeleteBtn,
      hideDeleteBtn
    };
  }
};

// 主应用
// 设置组件
const SettingsComponent = {
  template: `
    <div class="settings-container">
      <!-- 设置按钮 -->
      <button 
        class="settings-btn"
        @click="openSettings"
        aria-label="设置"
        title="设置"
      >
        <span class="settings-icon">⚙️</span>
      </button>

      <!-- 设置模态框 -->
      <div id="settings-modal" class="modal" :style="{ display: isOpen ? 'block' : 'none' }">
        <div class="modal-content settings-content">
          <div class="modal-header">
            <h3>设置</h3>
            <button class="close-modal" @click="closeSettings">&times;</button>
          </div>
          
          <div class="modal-tabs">
            <button 
              class="tab-btn"
              :class="{ active: activeTab === 'data' }"
              @click="activeTab = 'data'"
            >
              数据管理
            </button>
            <button 
              class="tab-btn"
              :class="{ active: activeTab === 'changelog' }"
              @click="activeTab = 'changelog'"
            >
              更新日志
            </button>
            <button 
              class="tab-btn"
              :class="{ active: activeTab === 'about' }"
              @click="activeTab = 'about'"
            >
              关于
            </button>
          </div>

          <div class="modal-body">
            <!-- 数据管理标签页 -->
            <div v-if="activeTab === 'data'" class="data-management">
              <div class="section-title">
                <h4>数据备份与恢复</h4>
                <p class="section-desc">管理您的个人数据，包括导出、导入和清除</p>
              </div>
              
              <div class="data-actions">
                <div class="action-group">
                  <button class="action-btn export-btn" @click="exportData">
                    📤 导出数据
                  </button>
                  <p class="action-desc">将所有数据导出为JSON文件</p>
                </div>
                
                <div class="action-group">
                  <button class="action-btn import-btn" @click="triggerImport">
                    📥 导入数据
                  </button>
                  <input 
                    type="file" 
                    ref="fileInput"
                    accept=".json"
                    style="display: none"
                    @change="importData"
                  >
                  <p class="action-desc">从JSON文件恢复数据</p>
                </div>
                
                <div class="action-group">
                  <button class="action-btn delete-btn" @click="confirmDeleteData">
                    🗑️ 清除所有数据
                  </button>
                  <p class="action-desc">删除所有本地存储的数据</p>
                </div>
              </div>
            </div>

            <!-- 更新日志标签页 -->
            <div v-if="activeTab === 'changelog'" class="changelog-section">
              <div class="section-title">
                <h4>更新日志</h4>
                <p class="section-desc">查看应用的更新历史和功能变更</p>
              </div>
              
              <div class="changelog-container">
                <div v-for="(version, index) in changelog" :key="index" class="changelog-item">
                  <div class="changelog-header">
                    <h5 class="version-number">{{ version.version }}</h5>
                    <span class="version-date">{{ version.date }}</span>
                  </div>
                  <ul class="changelog-details">
                    <li v-for="(item, i) in version.changes" :key="i" class="change-item">
                      <span class="change-type"></span>
                      <span class="change-text">{{ item.text }}</span>
                    </li>
                  </ul>
                </div>
                
                <div v-if="changelog.length === 0" class="empty-changelog">
                  暂无更新记录
                </div>
              </div>
            </div>

            <!-- 关于标签页 -->
            <div v-if="activeTab === 'about'" class="about-section">
              <div class="about-header">
                <img class="app-icon" src="./favicon.ico" alt="思霖起始页" style="width: 64px; height: 64px;">
                <div class="app-info">
                  <h4 class="app-name">思霖起始页</h4>
                  <p class="app-version">版本 {{ appVersion }}</p>
                </div>
              </div>
              
              <div class="about-content">
                <div class="feature-list">
                  <h5>功能特性</h5>
                  <ul>
                    <li>⏰ 时间显示与时钟</li>
                    <li>📝 待办事项管理</li>
                    <li>🍅 番茄钟计时器</li>
                    <li>🔍 搜索引擎</li>
                    <li>🌐 常用网站收藏</li>
                    <li>💡 灵光一现便签</li>
                    <li>🌙 深色/浅色模式切换</li>
                    <li>📊 本地数据存储</li>
                    <li>📝 更新日志查看</li>
                  </ul>
                </div>
                
                <div class="about-details">
                  <p><strong>开发者:</strong> {{ appAuthor }}</p>
                  <p><strong>最后更新:</strong> {{ lastUpdated }}</p>
                  <p><strong>隐私声明:</strong> 所有数据仅存储在您的本地设备上</p>
                  <p><strong>反馈方式:</strong> QQ 1147886308</p>
                  <p class="copyright">© {{ new Date().getFullYear() }} 思霖起始页</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const isOpen = ref(false);
    const activeTab = ref('data');
    const fileInput = ref(null);
    
    // 应用信息
    const appVersion = '1.2.0';
    const appAuthor = '思霖';
    const lastUpdated = '2025-11-19';
    
    // 更新日志数据
    const changelog = [
      {
        version: '1.2.0',
        date: '2025-11-19',
        changes: [
          { text: '全面重构，引入 Vue 3，功能与体验大升级' },
          { text: '🌓 深色/浅色主题：手动切换按钮，自动根据时间切换（可手动覆盖）' },
          { text: '⚙️ 设置中心：导出/导入数据，清除所有数据，关于页面，更新日志' },
          { text: '🍅 番茄钟计时器：工作/休息模式切换，自定义时长，实时进度条，本地保存设置' },
          { text: '💡 便签栏「灵光一现」：右侧悬停滑出，支持新建/编辑/删除便签，自动保存到本地' },
          { text: '🧱 Vue 3 重构：所有模块组件化，Composition API 风格，更易维护与扩展' },
          { text: '🎨 样式与交互：新增大量暗色模式适配样式，按钮、卡片、输入框增加过渡动画' },
          { text: '🔧 技术升级：引入 Vue 3 CDN，组件间通信使用 provide/inject' }
        ]
      },
      {
        version: '1.1.0',
        date: '2025-11-18',
        changes: [
          { text: '首个正式版本，基础功能完整可用' },
          { text: '⏰ 实时时钟与日期显示：模拟时钟 + 数字时间，自动更新' },
          { text: '📝 Todo List：支持添加、删除、标记完成，支持拖拽排序' },
          { text: '🔍 搜索引擎：支持百度/Google/Bing 三引擎切换，保留搜索历史（最多20条）' },
          { text: '🌐 常用网站导航：可自定义添加/删除网站，支持拖拽排序' },
          { text: '💾 本地存储：Todo、搜索历史、常用网站均自动保存' },
          { text: '📱 响应式布局：适配手机、平板、PC' },
          { text: '🎯 技术实现：原生 HTML + CSS + JavaScript，无依赖，使用 localStorage 持久化数据，拖拽排序基于原生 Drag & Drop API' }
        ]
      }
    ];
    


    // 打开设置
    const openSettings = () => {
      isOpen.value = true;
    };

    // 关闭设置
    const closeSettings = () => {
      isOpen.value = false;
    };

    // 触发文件导入
    const triggerImport = () => {
      fileInput.value.click();
    };

    // 导出数据功能
    const exportData = () => {
      try {
        // 收集所有数据
      const allData = {
        version: '1.2.0',
          exportDate: new Date().toISOString(),
          data: {
            websites: localStorage.getItem('websites') ? JSON.parse(localStorage.getItem('websites')) : [],
            todos: localStorage.getItem('todos') ? JSON.parse(localStorage.getItem('todos')) : [],
            searchHistory: localStorage.getItem('searchHistory') ? JSON.parse(localStorage.getItem('searchHistory')) : [],
            stickyNotes: localStorage.getItem('stickyNotes') ? JSON.parse(localStorage.getItem('stickyNotes')) : [],
            pomodoroSettings: localStorage.getItem('pomodoroSettings') ? JSON.parse(localStorage.getItem('pomodoroSettings')) : {},
            theme: localStorage.getItem('theme'),
            isUserSelectedTheme: localStorage.getItem('isUserSelectedTheme')
          }
        };
        
        // 转换为JSON字符串
        const jsonString = JSON.stringify(allData, null, 2);
        
        // 创建Blob对象
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // 设置下载文件名，包含日期
        const date = new Date();
        const formattedDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const fileName = `思霖起始页数据备份_${formattedDate}.json`;
        
        link.href = url;
        link.download = fileName;
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        
        // 清理
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // 显示成功提示
        alert('数据导出成功！');
        
      } catch (error) {
        console.error('导出数据时出错:', error);
        alert('数据导出失败，请重试。');
      }
    };

    // 导入数据功能
        const importData = (event) => {
          const file = event.target.files[0];
          if (!file) {
              return;
          }
          
          // 确认覆盖现有数据
          const confirmMessage = '导入数据将覆盖当前所有数据，确定继续吗？';
          if (!confirm(confirmMessage)) {
              fileInput.value.value = '';
              return;
          }
          
          const reader = new FileReader();
          
          reader.onload = (e) => {
              try {
                  // 解析JSON数据
                  const importedData = JSON.parse(e.target.result);
                  
                  // 验证数据格式
                  if (!importedData.version || !importedData.data) {
                      alert('无效的数据格式，请使用正确的备份文件。');
                      return;
                  }
                  
                  // 保存数据到localStorage
                  const { data } = importedData;
                  
                  // 保存各个模块的数据
                  if (data.websites) {
                      localStorage.setItem('websites', JSON.stringify(data.websites));
                  }
                  
                  if (data.todos) {
                      localStorage.setItem('todos', JSON.stringify(data.todos));
                  }
                  
                  if (data.searchHistory) {
                      localStorage.setItem('searchHistory', JSON.stringify(data.searchHistory));
                  }
                  
                  if (data.stickyNotes) {
                      localStorage.setItem('stickyNotes', JSON.stringify(data.stickyNotes));
                  }
                  
                  if (data.pomodoroSettings) {
                      localStorage.setItem('pomodoroSettings', JSON.stringify(data.pomodoroSettings));
                  }
                  
                  if (data.theme !== undefined) {
                      localStorage.setItem('theme', data.theme);
                  }
                  
                  if (data.isUserSelectedTheme !== undefined) {
                      localStorage.setItem('isUserSelectedTheme', data.isUserSelectedTheme);
                  }
                  
                  // 显示成功提示并刷新页面
                  alert('数据导入成功！页面将刷新以应用新数据。');
                  location.reload();
                  
              } catch (error) {
                  console.error('导入数据时出错:', error);
                  alert('数据导入失败，请检查文件格式是否正确。');
              }
          };
          
          reader.onerror = () => {
              alert('读取文件时出错，请重试。');
          };
          
          // 读取文件
          reader.readAsText(file);
          
          // 重置input值，允许重新选择同一个文件
          event.target.value = '';
        };

    // 确认删除数据
    const confirmDeleteData = () => {
      // 第一重确认
      const firstConfirm = confirm(
          '⚠️ 警告：此操作将删除所有数据！\n' +
          '请确保您已经备份了重要数据。\n' +
          '此操作无法撤销，确定要继续吗？'
      );
      
      if (!firstConfirm) {
          return;
      }
      
      // 第二重安全确认
      const securityWord = prompt(
          '为了确认您真的要删除所有数据，请输入 "DELETE"（全大写）：'
      );
      
      if (securityWord !== 'DELETE') {
          alert('操作已取消，数据未被删除。');
          return;
      }
      
      try {
          // 列出所有需要删除的localStorage键
          const storageKeys = [
              'websites',
              'todos',
              'searchHistory',
              'stickyNotes',
              'pomodoroSettings',
              'theme',
              'isUserSelectedTheme'
          ];
          
          // 删除所有数据
          storageKeys.forEach(key => {
              localStorage.removeItem(key);
          });
          
          // 显示成功提示并刷新页面
          alert('所有数据已成功删除！页面将刷新以应用更改。');
          location.reload();
          
      } catch (error) {
          console.error('删除数据时出错:', error);
          alert('数据删除失败，请重试。');
      }
    };

    // 点击模态框外部关闭
    const handleClickOutside = (event) => {
      const modal = document.getElementById('settings-modal');
      if (modal && event.target === modal) {
        closeSettings();
      }
    };

    onMounted(() => {
      window.addEventListener('click', handleClickOutside);
    });

    return {
      isOpen,
      activeTab,
      fileInput,
      appVersion,
      appAuthor,
      lastUpdated,
      changelog,
      openSettings,
      closeSettings,
      triggerImport,
      importData,
      exportData,
      confirmDeleteData
    };
  }
};

const app = createApp({
  components: {
    TimeComponent,
    TodoListComponent,
    SearchComponent,
    WebsitesComponent,
    StickyNotesComponent,
    SettingsComponent
  },
  setup() {
    // 主题状态管理：'light' 或 'dark'
    const isDarkMode = ref(false);
    // 标记是否为用户手动切换的主题（避免与自动切换冲突）
    const isUserSelectedTheme = ref(false);
    
    // 切换主题模式
    const toggleTheme = () => {
      isDarkMode.value = !isDarkMode.value;
      document.documentElement.classList.toggle('dark-mode', isDarkMode.value);
      // 标记为用户手动切换
      isUserSelectedTheme.value = true;
      // 保存到本地存储
      localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
      localStorage.setItem('isUserSelectedTheme', 'true');
    };
    
    // 根据时间自动切换主题（晚上18点到早上6点使用暗色主题）
    const autoSwitchThemeByTime = () => {
      // 如果用户已手动选择主题，则不进行自动切换
      if (isUserSelectedTheme.value) {
        return;
      }
      
      const now = new Date();
      const hours = now.getHours();
      // 晚上18点到早上6点使用暗色主题
      const shouldBeDark = hours >= 18 || hours < 6;
      
      if (isDarkMode.value !== shouldBeDark) {
        isDarkMode.value = shouldBeDark;
        document.documentElement.classList.toggle('dark-mode', shouldBeDark);
        // 保存到本地存储但不标记为用户选择
        localStorage.setItem('theme', shouldBeDark ? 'dark' : 'light');
      }
    };
    
    // 从本地存储加载主题偏好
    const loadThemePreference = () => {
      const savedTheme = localStorage.getItem('theme');
      const savedUserSelection = localStorage.getItem('isUserSelectedTheme');
      
      // 检查是否为用户手动选择的主题
      isUserSelectedTheme.value = savedUserSelection === 'true';
      
      if (savedTheme) {
        isDarkMode.value = savedTheme === 'dark';
      } else {
        // 检查系统偏好
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        isDarkMode.value = prefersDark;
      }
      document.documentElement.classList.toggle('dark-mode', isDarkMode.value);
    };
    
    // 监听主题变化并更新文档类
    watch(isDarkMode, (newValue) => {
      document.documentElement.classList.toggle('dark-mode', newValue);
    });
    
    // 初始化加载主题
    onMounted(() => {
      loadThemePreference();
      // 自动根据时间切换主题
      autoSwitchThemeByTime();
      // 设置定时器，每小时检查一次时间
      const timer = setInterval(autoSwitchThemeByTime, 60 * 60 * 1000);
      
      // 清理定时器
      onUnmounted(() => {
        clearInterval(timer);
      });
    });
    
    // 提供主题状态和切换方法给子组件
    provide('isDarkMode', isDarkMode);
    provide('toggleTheme', toggleTheme);
    
    return {
      isDarkMode,
      toggleTheme
    };
  },
  template: `
    <!-- 主题切换按钮 -->
    <button 
      class="theme-toggle" 
      @click="toggleTheme"
      aria-label="切换主题模式"
      :title="isDarkMode ? '切换到浅色模式' : '切换到深色模式'"
    >
      <span v-if="!isDarkMode" class="theme-icon">🌙</span>
      <span v-else class="theme-icon">☀️</span>
    </button>
    
    <!-- 设置组件 -->
    <SettingsComponent />
    
    <!-- 主要内容区域 - 时间和Todo左右排列 -->
    <div class="main-content">
      <TimeComponent />
      <TodoListComponent />
    </div>

    <!-- 下方内容区域 -->
    <div class="bottom-section">
      <SearchComponent />
      <WebsitesComponent />
    </div>
    
    <!-- 页脚 -->
    <footer class="footer">
      © 2025 思霖起始页 
    </footer>
    
    <!-- 右侧便签栏 -->
    <StickyNotesComponent />
  `
});

// 挂载应用
app.mount('#app');