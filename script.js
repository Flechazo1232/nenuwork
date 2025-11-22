// 存储已完成事项数据
let tasks = [];
// 本地存储键名
const STORAGE_KEY = 'done_list_records';

// URL跳转功能相关配置
let urlShortcuts = {};
const URL_SHORTCUTS_KEY = 'url_shortcuts';

// DOM 元素
const addTaskBtn = document.getElementById('add-task-btn');
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const taskColor = document.getElementById('task-color');
const taskName = document.getElementById('task-name');
const taskStart = document.getElementById('task-start');
const taskEnd = document.getElementById('task-end');
const taskCategory = document.getElementById('task-category');
const taskTags = document.getElementById('task-tags');
// 提醒功能在done list中不需要，已移除相关DOM引用
const confirmTaskBtn = document.getElementById('confirm-task-btn');
const clockCanvas = document.getElementById('clock-canvas');
const ctx = clockCanvas.getContext('2d');

// 任务分类筛选器
const categoryFilter = document.createElement('select');
categoryFilter.id = 'category-filter';
categoryFilter.className = 'w-32 p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200';
categoryFilter.innerHTML = `
    <option value="all">所有分类</option>
    <option value="工作">工作</option>
    <option value="学习">学习</option>
    <option value="生活">生活</option>
    <option value="健康">健康</option>
    <option value="其他">其他</option>
`;

// 确保canvas尺寸响应式
function resizeCanvas() {
    const clockRing = document.getElementById('clock-ring');
    const size = clockRing.offsetWidth;
    clockCanvas.width = size;
    clockCanvas.height = size;
}

// 原计划渲染函数已移除，现在使用独立的计划管理系统
// 请参考后面的initPlans()、renderPlans()等函数实现

// 初始调整canvas尺寸并监听窗口大小变化
resizeCanvas();
window.addEventListener('resize', () => {
    resizeCanvas();
    drawClock();
});

// 检查并执行每日自动刷新功能
function checkDailyRefresh() {
    // 获取当前日期（不含时间部分）
    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];
    
    // 获取最后刷新日期
    const lastRefreshDate = localStorage.getItem('lastRefreshDate');
    
    // 如果是新的一天，则重置每日任务
    if (todayDateStr !== lastRefreshDate) {
        // 只清除特定的每日任务数据，保留其他重要数据
        localStorage.removeItem(STORAGE_KEY); // 只清除任务记录，保留其他数据
        
        // 更新最后刷新日期
        localStorage.setItem('lastRefreshDate', todayDateStr);
        
        // 清理过期数据（超过30天的旧计划）
        const plansDataStr = localStorage.getItem('plansData');
        if (plansDataStr) {
            let plansData = JSON.parse(plansDataStr);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            // 清理超过30天的旧日计划
            if (plansData.daily) {
                plansData.daily = plansData.daily.filter(plan => {
                    const planDate = new Date(plan.createdAt);
                    return planDate > thirtyDaysAgo || plan.completed === false;
                });
            }
            
            localStorage.setItem('plansData', JSON.stringify(plansData));
        }
        
        // 记录重置操作和友好提示
        console.log('已执行每日数据重置');
        console.log('提示：日计划数据已保留，超过30天的旧计划已自动清理');
    }
}

// 从本地存储加载任务数据
function loadTasksFromStorage() {
    try {
        const storedTasks = localStorage.getItem(STORAGE_KEY);
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
            return true;
        }
    } catch (error) {
        console.error('加载任务数据失败:', error);
    }
    return false;
}

// 保存任务数据到本地存储
function saveTasksToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error('保存任务数据失败:', error);
        return false;
    }
}

// 从本地存储加载URL快捷方式
function loadUrlShortcutsFromStorage() {
    try {
        const storedShortcuts = localStorage.getItem(URL_SHORTCUTS_KEY);
        if (storedShortcuts) {
            urlShortcuts = JSON.parse(storedShortcuts);
            console.log('URL快捷方式已加载');
            return true;
        }
    } catch (error) {
        console.error('加载URL快捷方式失败:', error);
    }
    return false;
}

// 保存URL快捷方式到本地存储
function saveUrlShortcutsToStorage() {
    try {
        localStorage.setItem(URL_SHORTCUTS_KEY, JSON.stringify(urlShortcuts));
        console.log('URL快捷方式已保存');
        return true;
    } catch (error) {
        console.error('保存URL快捷方式失败:', error);
        return false;
    }
}

// 添加或更新URL快捷方式
function addUrlShortcut(key, url, description = '') {
    if (!key || !url) {
        console.error('快捷键键名和URL不能为空');
        return false;
    }
    
    // 验证URL格式
    try {
        new URL(url);
    } catch (error) {
        // 如果不是完整URL，尝试添加http://前缀
        try {
            url = 'http://' + url;
            new URL(url);
        } catch (error) {
            console.error('无效的URL格式');
            return false;
        }
    }
    
    urlShortcuts[key.toLowerCase()] = {
        url: url,
        description: description,
        createdAt: new Date().toISOString()
    };
    
    return saveUrlShortcutsToStorage();
}

// 删除URL快捷方式
function deleteUrlShortcut(key) {
    if (!urlShortcuts[key.toLowerCase()]) {
        console.error('未找到指定的快捷方式');
        return false;
    }
    
    delete urlShortcuts[key.toLowerCase()];
    return saveUrlShortcutsToStorage();
}

// 跳转到指定URL
function navigateToUrl(key) {
    const shortcut = urlShortcuts[key.toLowerCase()];
    if (shortcut) {
        window.open(shortcut.url, '_blank');
        console.log(`已跳转到: ${shortcut.url}`);
        return true;
    } else {
        console.log(`未找到键名为 ${key} 的URL快捷方式`);
        return false;
    }
}

// 设置时间进度和任务完成度监控
let progressCheckInterval = null;

// 初始化时间进度监控功能
function initProgressMonitoring() {
    // 检查是否已经初始化
    if (progressCheckInterval) {
        clearInterval(progressCheckInterval);
    }
    
    // 每15分钟检查一次进度
    progressCheckInterval = setInterval(checkDayProgress, 15 * 60 * 1000);
    
    // 首次加载页面时立即检查一次
    setTimeout(checkDayProgress, 5000);
}

// 检查一天的进度和任务完成情况
function checkDayProgress() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // 计算一天的进度百分比（0-100%）
    const totalMinutesInDay = 24 * 60;
    const elapsedMinutes = currentHour * 60 + currentMinute;
    const dayProgressPercentage = Math.round((elapsedMinutes / totalMinutesInDay) * 100);
    
    // 计算任务完成度（这里简单统计今天已完成的任务数）
    const todayTasks = getTodayTasks();
    const taskCompletionPercentage = calculateTaskCompletionPercentage(todayTasks);
    
    // 检查是否需要显示提醒
    if (shouldShowProgressReminder(dayProgressPercentage, taskCompletionPercentage)) {
        showProgressReminder(dayProgressPercentage, taskCompletionPercentage, todayTasks);
    }
}

// 获取今天的任务
function getTodayTasks() {
    // 简单起见，这里返回所有任务
    // 在实际应用中，可以根据日期筛选今天的任务
    return tasks;
}

// 计算任务完成度百分比
function calculateTaskCompletionPercentage(tasksList) {
    if (tasksList.length === 0) return 0;
    
    // 这里简化处理，实际应用中需要区分已完成和未完成的任务
    // 为了演示，我们暂时假设所有任务都是待完成的
    // 如果任务对象中有completed属性，可以据此计算
    
    // 对于日计划，我们可以计算子任务的完成度
    const dailyPlans = plansData.daily;
    if (dailyPlans.length === 0) return 0;
    
    let totalSubtasks = 0;
    let completedSubtasks = 0;
    
    dailyPlans.forEach(plan => {
        plan.subtasks.forEach(subtask => {
            totalSubtasks++;
            if (subtask.completed) {
                completedSubtasks++;
            }
        });
    });
    
    return totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
}

// 判断是否应该显示进度提醒
function shouldShowProgressReminder(dayProgress, taskProgress) {
    // 当一天过去较多但任务完成较少时显示提醒
    // 例如：一天过去60%但任务只完成20%，或一天过去80%但任务只完成30%
    const progressDifference = dayProgress - taskProgress;
    
    return (
        (dayProgress >= 60 && progressDifference >= 40) ||
        (dayProgress >= 80 && progressDifference >= 50) ||
        (dayProgress >= 90 && taskProgress < 70)
    );
}

// 显示进度提醒
function showProgressReminder(dayProgress, taskProgress, todayTasks) {
    // 查找或创建提醒元素
    let reminderElement = document.getElementById('progress-reminder');
    
    if (!reminderElement) {
        reminderElement = document.createElement('div');
        reminderElement.id = 'progress-reminder';
        reminderElement.className = 'fixed bottom-4 right-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg shadow-lg max-w-sm z-50 transform transition-all duration-300 opacity-0 translate-y-4';
        document.body.appendChild(reminderElement);
    }
    
    // 构建提醒消息
    let message = `<strong>今日进度提醒</strong><br>`;
    message += `今天的时间已经过去 <strong>${dayProgress}%</strong>，`;
    message += `而您的任务只完成了约 <strong>${taskProgress}%</strong><br>`;
    
    // 添加建议
    if (dayProgress > taskProgress) {
        message += `<br>建议您：<ul class="list-disc list-inside text-sm mt-1">`;
        message += `<li>优先完成剩余时间紧张的任务</li>`;
        message += `<li>考虑调整任务优先级或请求帮助</li>`;
        
        // 找出未完成的重要任务
        const pendingTasks = todayTasks.slice(0, 3);
        if (pendingTasks.length > 0) {
            message += `<li>以下是您的待办任务：</li>`;
            pendingTasks.forEach(task => {
                message += `<li class="ml-4">• ${task.name} (${task.startTime}-${task.endTime})</li>`;
            });
        }
        
        message += `</ul>`;
    }
    
    // 添加关闭按钮
    message += `<div class="mt-3 text-right">`;
    message += `<button id="close-reminder" class="text-xs px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded transition-colors">关闭</button>`;
    message += `</div>`;
    
    reminderElement.innerHTML = message;
    
    // 显示提醒（添加动画）
    setTimeout(() => {
        reminderElement.style.opacity = '1';
        reminderElement.style.transform = 'translate-y(0)';
    }, 100);
    
    // 添加关闭事件
    document.getElementById('close-reminder').addEventListener('click', () => {
        reminderElement.style.opacity = '0';
        reminderElement.style.transform = 'translate-y-4';
        setTimeout(() => {
            if (document.body.contains(reminderElement)) {
                document.body.removeChild(reminderElement);
            }
        }, 300);
    });
    
    // 设置自动关闭（5分钟后）
    setTimeout(() => {
        if (document.body.contains(reminderElement)) {
            reminderElement.style.opacity = '0';
            reminderElement.style.transform = 'translate-y-4';
            setTimeout(() => {
                if (document.body.contains(reminderElement)) {
                    document.body.removeChild(reminderElement);
                }
            }, 300);
        }
    }, 5 * 60 * 1000);
}

// 初始化页面
function init() {
    // 检查并执行每日自动刷新
    checkDailyRefresh();
    
    // 从本地存储加载任务数据
    loadTasksFromStorage();
    
    // 在任务列表上方添加分类筛选器
    const taskListParent = taskList.parentElement;
    taskListParent.insertBefore(categoryFilter, taskList);
    
    // 更新UI显示已保存的任务
    updateTaskList();
    
    // 初始化独立的计划功能
    initPlans();
    
    // 绘制环状时间图
    drawClock();
    
    // 添加事件监听器
    addTaskBtn.addEventListener('click', toggleTaskForm);
    document.addEventListener('keydown', handleEnterKey);
    
    // 添加确认按钮事件
    if (confirmTaskBtn) {
        confirmTaskBtn.addEventListener('click', addTask);
    }
    
    // 提醒功能在done list中不需要，已移除事件监听
    
    // 添加分类筛选事件
    categoryFilter.addEventListener('change', updateTaskList);
    
    // 设置默认时间
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    taskStart.value = `${currentHour}:${currentMinute}`;
    taskEnd.value = `${(parseInt(currentHour) + 1) % 24}:${currentMinute}`;
    
    // 为任务列表添加悬停效果（可选的额外交互）
    taskList.addEventListener('mouseover', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (taskItem) {
            taskItem.style.transform = 'translateZ(10px)';
        }
    });
    
    taskList.addEventListener('mouseout', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (taskItem) {
            taskItem.style.transform = 'translateZ(0)';
        }
    });
    
    // 启动进度监控功能
    initProgressMonitoring();
    
    // 初始化感受编辑弹窗事件
    const feelingModal = document.getElementById('feeling-modal');
    const closeFeelingModalBtn = document.getElementById('close-feeling-modal');
    const feelingContent = document.getElementById('feeling-content');
    
    if (closeFeelingModalBtn) {
        closeFeelingModalBtn.addEventListener('click', closeFeelingModal);
    }
    
    // 点击弹窗外部关闭弹窗
    if (feelingModal) {
        feelingModal.addEventListener('click', (e) => {
            if (e.target === feelingModal) {
                saveFeeling(); // 自动保存并关闭
            }
        });
    }
    
    // 文本框事件监听
    if (feelingContent) {
        // 输入事件更新字数计数
        feelingContent.addEventListener('input', updateCharacterCount);
        
        // 文本框失去焦点时自动保存 - 但需要检查目标元素是否在弹窗内
        feelingContent.addEventListener('blur', (e) => {
            // 获取弹窗元素
            const modal = document.getElementById('feeling-modal');
            
            // 检查失去焦点后的目标元素是否在弹窗内
            setTimeout(() => {
                const activeElement = document.activeElement;
                // 如果弹窗不在DOM中或者焦点不在弹窗内，则保存
                if (!modal || !modal.contains(activeElement)) {
                    saveFeeling();
                }
            }, 200);
        });
    }
    
    // ESC键关闭弹窗 - 使用防抖处理
    let escTimeout = null;
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && feelingModal && !feelingModal.classList.contains('hidden')) {
            // 清除之前的定时器
            if (escTimeout) clearTimeout(escTimeout);
            
            // 立即保存并关闭
            saveFeeling();
        }
    });
}

// 日历功能已移除

// 切换任务表单显示/隐藏
function toggleTaskForm() {
    if (taskForm.classList.contains('hidden')) {
        // 显示表单，添加动画
        taskForm.classList.remove('hidden');
        taskForm.classList.add('animate-fade-in');
        // 移除动画类以便下次使用
        setTimeout(() => {
            taskForm.classList.remove('animate-fade-in');
        }, 300);
        taskName.focus();
    } else {
        // 隐藏表单，添加淡出动画效果
        taskForm.style.opacity = '0';
        taskForm.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            taskForm.classList.add('hidden');
            taskForm.style.opacity = '1';
            taskForm.style.transform = 'translateY(0)';
        }, 200);
    }
}

// 处理回车键添加任务
function handleEnterKey(e) {
    if (e.key === 'Enter' && !taskForm.classList.contains('hidden') && !e.shiftKey) {
        e.preventDefault();
        addTask();
    }
}

// 添加任务
function addTask() {
    const color = taskColor.value;
    const name = taskName.value.trim();
    const start = taskStart.value;
    const end = taskEnd.value;
    const category = taskCategory.value;
    const tagsInput = taskTags.value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    // 验证输入
    if (!name || !start || !end) {
        alert('请填写完整的任务信息');
        return;
    }
    
    // 转换时间为小时数
    const [startHourNum, startMinuteNum] = start.split(':').map(Number);
    const [endHourNum, endMinuteNum] = end.split(':').map(Number);
    
    let startHour = startHourNum + startMinuteNum / 60;
    let endHour = endHourNum + endMinuteNum / 60;
    
    // 处理跨天情况
    const isOvernight = endHour < startHour;
    if (isOvernight) {
        endHour += 24; // 给结束时间加上24小时表示跨天
    }
    
    // 添加任务
    const task = {
        id: Date.now(),
        color,
        name,
        start: startHour,
        end: endHour,
        startTime: start,
        endTime: end,
        category,
        tags,
        isOvernight: isOvernight
    };
    
    tasks.push(task);
    
    // 保存到本地存储
    saveTasksToStorage();
    
    // 更新UI
    updateTaskList();
    drawClock();
    
    // 清空表单并隐藏
    resetTaskForm();
}

// 重置任务表单
function resetTaskForm() {
    taskName.value = '';
    taskStart.value = '';
    taskEnd.value = '';
    taskColor.value = '#3b82f6';
    taskCategory.value = '工作';
    taskTags.value = '';
    
    // 设置默认时间为当前时间
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    taskStart.value = `${currentHour}:${currentMinute}`;
    taskEnd.value = `${(parseInt(currentHour) + 1) % 24}:${currentMinute}`;
    
    // 使用动画隐藏表单
    taskForm.style.opacity = '0';
    taskForm.style.transform = 'translateY(-10px)';
    setTimeout(() => {
        taskForm.classList.add('hidden');
        taskForm.style.opacity = '1';
        taskForm.style.transform = 'translateY(0)';
    }, 200);
}

// 更新任务列表显示
function updateTaskList() {
    // 清空任务列表
    taskList.innerHTML = '';
    
    // 分类筛选
    const selectedCategory = categoryFilter.value;
    let filteredTasks = tasks;
    if (selectedCategory !== 'all') {
        filteredTasks = tasks.filter(task => task.category === selectedCategory);
    }
    
    // 如果没有任务，显示提示信息
    if (filteredTasks.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'text-gray-500 text-center py-6';
        emptyMessage.textContent = '暂无任务，请点击右上角按钮添加';
        taskList.appendChild(emptyMessage);
        return;
    }
    
    // 按开始时间排序任务
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        const aHours = timeToHours(a.startTime);
        const bHours = timeToHours(b.startTime);
        return aHours - bHours;
    });
    
    // 创建任务元素
    sortedTasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item relative bg-white rounded-lg shadow-sm overflow-hidden mb-2';
        
        const taskHeader = document.createElement('div');
        taskHeader.className = 'flex items-center px-3 py-1 bg-gray-50 border-b';
        
        const categoryBadge = document.createElement('span');
        categoryBadge.className = 'text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary mr-2';
        categoryBadge.textContent = task.category || '其他';
        
        const timeDisplay = document.createElement('span');
        timeDisplay.className = 'text-xs text-gray-500 mr-auto';
        timeDisplay.textContent = `${task.startTime} ~ ${task.endTime}${task.isOvernight ? ' (跨天)' : ''}`;
        
        // 记录按钮
        const recordButton = document.createElement('button');
        recordButton.className = 'text-xs px-2 py-0.5 ml-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors';
        recordButton.textContent = '记录';
        recordButton.addEventListener('click', (e) => {
            e.stopPropagation();
            openFeelingModal(task.id);
        });
        
        taskHeader.appendChild(categoryBadge);
        taskHeader.appendChild(timeDisplay);
        taskHeader.appendChild(recordButton);
        
        const taskBar = document.createElement('div');
        taskBar.className = 'p-3';
        taskBar.style.backgroundColor = task.color;
        taskBar.innerHTML = `
            <span class="font-medium text-white">${task.name}</span>
        `;
        
        // 标签容器
        if (task.tags && task.tags.length > 0) {
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'flex flex-wrap gap-1 mt-1';
            
            task.tags.forEach(tag => {
                const tagBadge = document.createElement('span');
                tagBadge.className = 'text-xs px-1.5 py-0.5 rounded-full bg-white/30 text-white';
                tagBadge.textContent = tag;
                tagsContainer.appendChild(tagBadge);
            });
            
            taskBar.appendChild(tagsContainer);
        }
        
        // 添加删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn absolute top-2 right-2 bg-white/20 hover:bg-white/40 rounded-full p-1 text-white transition-all duration-200';
        deleteBtn.innerHTML = '<i class="fa fa-times"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });
        
        // 添加任务点击事件
        taskBar.addEventListener('click', () => {
            console.log('Task clicked:', task);
        });
        
        // 组合元素
        taskItem.appendChild(taskHeader);
        taskItem.appendChild(taskBar);
        taskItem.appendChild(deleteBtn);
        taskList.appendChild(taskItem);
        
        // 为任务项添加动画效果
        setTimeout(() => {
            taskItem.classList.add('animate-slide-in');
        }, 10);
    });
}

// 删除任务
// 打开感受编辑弹窗
function openFeelingModal(taskId) {
    // 获取任务感受数据
    const taskFeelings = JSON.parse(localStorage.getItem('taskFeelings') || '{}');
    
    // 设置当前任务ID
    const currentTaskId = document.getElementById('current-task-id');
    if (currentTaskId) {
        currentTaskId.value = taskId;
    }
    
    // 填充已有感受内容
    const feelingContent = document.getElementById('feeling-content');
    if (feelingContent) {
        // 设置最大长度
        feelingContent.maxLength = 500;
        feelingContent.value = taskFeelings[taskId] || '';
        
        // 更新字数计数
        updateCharacterCount();
        
        // 自动聚焦到文本框并将光标定位到末尾
        feelingContent.focus();
        feelingContent.setSelectionRange(feelingContent.value.length, feelingContent.value.length);
    }
    
    // 显示弹窗
    const feelingModal = document.getElementById('feeling-modal');
    if (feelingModal) {
        feelingModal.classList.remove('hidden');
    }
}

// 更新字数计数
function updateCharacterCount() {
    const feelingContent = document.getElementById('feeling-content');
    const charCountDisplay = document.getElementById('char-count-display');
    
    if (feelingContent && !charCountDisplay) {
        // 创建字数计数元素
        const modalFooter = document.querySelector('#feeling-modal .modal-footer');
        if (modalFooter) {
            const countElement = document.createElement('span');
            countElement.id = 'char-count-display';
            countElement.className = 'text-sm text-gray-500';
            modalFooter.insertBefore(countElement, modalFooter.firstChild);
        }
    }
    
    if (feelingContent && charCountDisplay) {
        charCountDisplay.textContent = `${feelingContent.value.length}/${feelingContent.maxLength}`;
    }
}

// 关闭感受编辑弹窗
function closeFeelingModal() {
    const feelingModal = document.getElementById('feeling-modal');
    if (feelingModal) {
        feelingModal.classList.add('hidden');
        
        // 清空内容
        const feelingContent = document.getElementById('feeling-content');
        const currentTaskId = document.getElementById('current-task-id');
        if (feelingContent) feelingContent.value = '';
        if (currentTaskId) currentTaskId.value = '';
    }
}

// 保存感受内容
function saveFeeling() {
    const currentTaskId = document.getElementById('current-task-id');
    const feelingContent = document.getElementById('feeling-content');
    
    if (currentTaskId && currentTaskId.value) {
        // 获取现有感受数据
        const taskFeelings = JSON.parse(localStorage.getItem('taskFeelings') || '{}');
        
        // 更新感受
        taskFeelings[currentTaskId.value] = feelingContent ? feelingContent.value : '';
        
        // 保存到localStorage
        localStorage.setItem('taskFeelings', JSON.stringify(taskFeelings));
        
        // 显示保存成功提示
        showSaveSuccessMessage();
    }
    
    // 关闭弹窗
    closeFeelingModal();
}

// 显示保存成功提示
function showSaveSuccessMessage() {
    // 创建提示元素
    const message = document.createElement('div');
    message.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg transform transition-all duration-300 opacity-0 translate-y-2';
    message.textContent = '感受已保存';
    document.body.appendChild(message);
    
    // 显示提示
    setTimeout(() => {
        message.classList.remove('opacity-0', 'translate-y-2');
    }, 10);
    
    // 自动消失
    setTimeout(() => {
        message.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => {
            document.body.removeChild(message);
        }, 300);
    }, 2000);
}

function deleteTask(id) {
    // 找到要删除的任务元素
    const taskElements = taskList.querySelectorAll('.task-item');
    let taskElementToRemove = null;
    
    tasks.forEach((task, index) => {
        if (task.id === id) {
            taskElementToRemove = taskElements[index];
        }
    });
    
    // 添加删除动画
    if (taskElementToRemove) {
        taskElementToRemove.style.opacity = '0';
        taskElementToRemove.style.height = '0';
        taskElementToRemove.style.marginBottom = '0';
        taskElementToRemove.style.paddingBottom = '0';
        taskElementToRemove.style.overflow = 'hidden';
        taskElementToRemove.style.transition = 'all 0.3s ease';
    }
    
    // 从数据中删除
    tasks = tasks.filter(task => task.id !== id);
    
    // 保存到本地存储
    saveTasksToStorage();
    
    // 等待动画完成后更新UI
    setTimeout(() => {
        updateTaskList();
        drawClock();
    }, 300);
}

// 绘制圆形时间图
function drawClock() {
    const centerX = clockCanvas.width / 2;
    const centerY = clockCanvas.height / 2;
    // 计算响应式半径
    const radius = Math.min(centerX, centerY) - 10;
    
    // 清空画布
    ctx.clearRect(0, 0, clockCanvas.width, clockCanvas.height);
    
    // 绘制单一圆形背景
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff'; // 白色背景
    ctx.fill();
    ctx.strokeStyle = '#e5e7eb'; // 淡灰色边框
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 绘制小时数字 - 移至圆形内测
    for (let hour = 0; hour < 24; hour++) {
        const angle = (hour - 6) * (Math.PI / 12); // 从顶部开始，顺时针方向
        // 将数字放在内测，使用较小的半径
        const markerRadius = radius * 0.85; // 内测位置
        const x = centerX + Math.cos(angle) * markerRadius;
        const y = centerY + Math.sin(angle) * markerRadius;
        
        // 绘制小时数字
        ctx.font = `bold ${Math.max(12, radius * 0.08)}px Inter, sans-serif`;
        ctx.fillStyle = '#4b5563';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hour.toString(), x, y);
    }
    
    // 保留中间指针功能
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const currentAngle = (currentHour - 6) * (Math.PI / 12);
    
    // 绘制指针
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
        centerX + Math.cos(currentAngle) * radius * 0.7, // 指针长度
        centerY + Math.sin(currentAngle) * radius * 0.7
    );
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制中心圆点
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
    
    // 绘制任务区域（将以扇形形式呈现）
    drawTasksOnClock();
}

// 绘制任务区域 - 扇形色块形式
function drawTasksOnClock() {
    const centerX = clockCanvas.width / 2;
    const centerY = clockCanvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // 扇形的内半径 - 从圆心开始
    const innerRadius = 0;
    
    // 按任务顺序绘制，让时间较早的任务在底层
    const sortedTasks = [...tasks].sort((a, b) => a.start - b.start);
    
    sortedTasks.forEach(task => {
        // 处理跨天任务
        if (task.isOvernight) {
            // 绘制第一天的部分（从开始时间到24点）
            const startAngle = (task.start - 6) * (Math.PI / 12);
            const midnightAngle = (24 - 6) * (Math.PI / 12); // 24点对应的角度
            
            // 绘制扇形色块
            ctx.beginPath();
            ctx.moveTo(centerX, centerY); // 从圆心开始
            ctx.arc(centerX, centerY, radius * 0.75, startAngle, midnightAngle);
            ctx.closePath(); // 闭合到圆心
            
            // 填充颜色，保持半透明效果
            ctx.fillStyle = `${task.color}BF`; // 75%的不透明度
            ctx.fill();
            
            // 绘制第二天的部分（从0点到结束时间）
            const endHourAdjusted = task.end - 24; // 调整为0-24小时范围
            const endAngle = (endHourAdjusted - 6) * (Math.PI / 12);
            const midnightAngleNext = (-6) * (Math.PI / 12); // 0点对应的角度
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius * 0.75, midnightAngleNext, endAngle);
            ctx.closePath();
            ctx.fillStyle = `${task.color}BF`;
            ctx.fill();
        } else {
            // 非跨天任务的绘制逻辑
            const startAngle = (task.start - 6) * (Math.PI / 12);
            const endAngle = (task.end - 6) * (Math.PI / 12);
            
            // 绘制扇形色块
            ctx.beginPath();
            ctx.moveTo(centerX, centerY); // 从圆心开始
            ctx.arc(centerX, centerY, radius * 0.75, startAngle, endAngle);
            ctx.closePath(); // 闭合到圆心
            
            // 填充颜色，保持半透明效果
            ctx.fillStyle = `${task.color}BF`; // 75%不透明度
            ctx.fill();
        }
    });
}

// 将时间字符串转换为小时数（带小数）
function timeToHours(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + minutes / 60;
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', function() {
    init();
    // 功能面板窗口初始化
    initFeatureWindow();
});

// ===== 计划管理功能 =====

// 计划数据结构
let plansData = {
    week: [],
    month: [],
    year: [],
    daily: [] // 新增日计划数据结构
};

// DOM元素引用
const planFormModal = document.getElementById('plan-form-modal');
const planModalTitle = document.getElementById('plan-modal-title');
const planType = document.getElementById('plan-type');
const planId = document.getElementById('plan-id');
const planTitle = document.getElementById('plan-title');
const planDeadline = document.getElementById('plan-deadline');
const subtasksContainer = document.getElementById('subtasks-container');
const addSubtaskBtn = document.getElementById('add-subtask');
const closePlanModalBtn = document.getElementById('close-plan-modal');
const cancelPlanBtn = document.getElementById('cancel-plan-btn');
const savePlanBtn = document.getElementById('save-plan-btn');
const addWeekPlanBtn = document.getElementById('add-week-plan-btn');
const addMonthPlanBtn = document.getElementById('add-month-plan-btn');
const addYearPlanBtn = document.getElementById('add-year-plan-btn');
const addDailyPlanBtn = document.getElementById('add-daily-plan-btn');
const weekTasksContainer = document.getElementById('week-tasks');
const monthTasksContainer = document.getElementById('month-tasks');
const yearTasksContainer = document.getElementById('year-tasks');
const dailyPlansContainer = document.getElementById('daily-plans');

// 初始化计划数据
function initPlansData() {
    const savedPlans = localStorage.getItem('plansData');
    if (savedPlans) {
        plansData = JSON.parse(savedPlans);
        // 确保daily数组存在
        if (!plansData.daily) {
            plansData.daily = [];
        }
    }
    // 渲染所有计划
    renderPlans('week');
    renderPlans('month');
    renderPlans('year');
    renderPlans('daily');
}

// 打开计划编辑模态框
function openPlanModal(type) {
    planType.value = type;
    planId.value = '';
    planTitle.value = '';
    
    // 获取截止时间输入框的父容器（假设在一个div中）
    const deadlineContainer = planDeadline.parentElement;
    
    // 设置今天的日期作为默认截止日期
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    if (type === 'year') {
        // 年计划隐藏截止时间编辑
        if (deadlineContainer) {
            deadlineContainer.classList.add('hidden');
        }
        // 为年计划设置年底作为默认截止日期
        const endOfYear = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
        planDeadline.value = endOfYear;
    } else {
        // 其他计划显示截止时间编辑
        if (deadlineContainer) {
            deadlineContainer.classList.remove('hidden');
        }
        planDeadline.value = formattedDate;
    }
    
    // 重置子任务容器，只保留一个空输入框
    subtasksContainer.innerHTML = `
        <div class="flex items-center subtask-item">
            <input type="text" class="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="输入子任务...">
            <button type="button" class="ml-2 text-red-500 hover:text-red-700 remove-subtask">
                <i class="fa fa-minus-circle"></i>
            </button>
        </div>
    `;
    
    // 设置模态框标题
    const typeText = type === 'week' ? '周' : type === 'month' ? '月' : type === 'year' ? '年' : '日';
    planModalTitle.textContent = `添加${typeText}计划`;
    
    // 显示模态框
    planFormModal.classList.remove('hidden');
}

// 关闭计划编辑模态框
function closePlanModal() {
    planFormModal.classList.add('hidden');
}

// 添加新的子任务输入框
function addSubtask() {
    const subtaskItem = document.createElement('div');
    subtaskItem.className = 'flex items-center subtask-item';
    subtaskItem.innerHTML = `
        <input type="text" class="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="输入子任务...">
        <button type="button" class="ml-2 text-red-500 hover:text-red-700 remove-subtask">
            <i class="fa fa-minus-circle"></i>
        </button>
    `;
    
    subtasksContainer.appendChild(subtaskItem);
    
    // 为新添加的删除按钮添加事件监听器
    subtaskItem.querySelector('.remove-subtask').addEventListener('click', function() {
        if (subtasksContainer.children.length > 1) {
            subtaskItem.remove();
        }
    });
}

// 保存计划
function savePlan() {
    const type = planType.value;
    const title = planTitle.value.trim();
    const deadline = planDeadline.value;
    
    if (!title) {
        alert('请输入计划标题');
        return;
    }
    
    // 收集子任务
    const subtasks = [];
    const subtaskInputs = subtasksContainer.querySelectorAll('.subtask-item input');
    subtaskInputs.forEach(input => {
        const subtaskText = input.value.trim();
        if (subtaskText) {
            subtasks.push({
                text: subtaskText,
                completed: false
            });
        }
    });
    
    // 创建计划对象
    const plan = {
        id: planId.value || Date.now().toString(),
        title: title,
        deadline: deadline,
        subtasks: subtasks,
        createdAt: new Date().toISOString()
    };
    
    // 更新计划数据
    if (planId.value) {
        // 编辑现有计划
        const index = plansData[type].findIndex(p => p.id === planId.value);
        if (index !== -1) {
            plansData[type][index] = plan;
        }
    } else {
        // 添加新计划
        plansData[type].push(plan);
    }
    
    // 保存到localStorage
    localStorage.setItem('plansData', JSON.stringify(plansData));
    
    // 渲染更新后的计划列表
    renderPlans(type);
    
    // 关闭模态框
    closePlanModal();
}

// 渲染计划列表
function renderPlans(type) {
    let container;
    switch (type) {
        case 'week':
            container = weekTasksContainer;
            break;
        case 'month':
            container = monthTasksContainer;
            break;
        case 'year':
            container = yearTasksContainer;
            break;
        case 'daily':
            container = dailyPlansContainer;
            break;
        default:
            return;
    }
    
    const plans = plansData[type];
    
    if (plans.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center text-sm py-8">暂时无计划</p>';
        return;
    }
    
    // 按截止日期排序（最近的在前）
    plans.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    let html = '';
    plans.forEach(plan => {
        // 计算剩余天数
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDate = new Date(plan.deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let daysText = '';
        let daysClass = '';
        if (diffDays < 0) {
            daysText = `已逾期${Math.abs(diffDays)}天`;
            daysClass = 'text-red-500';
        } else if (diffDays === 0) {
            daysText = '今天截止';
            daysClass = 'text-orange-500';
        } else if (diffDays <= 3) {
            daysText = `${diffDays}天后截止`;
            daysClass = 'text-yellow-500';
        } else {
            daysText = `${diffDays}天后截止`;
            daysClass = 'text-green-500';
        }
        
        // 渲染子任务
        let subtasksHtml = '';
        if (plan.subtasks.length > 0) {
            subtasksHtml = '<div class="mt-2 pl-4 space-y-1">';
            plan.subtasks.forEach((subtask, index) => {
                subtasksHtml += `
                    <div class="flex items-center text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'}">
                        <input type="checkbox" class="mr-2 subtask-checkbox" data-plan-id="${plan.id}" data-subtask-index="${index}" ${subtask.completed ? 'checked' : ''}>
                        <span>${subtask.text}</span>
                    </div>
                `;
            });
            subtasksHtml += '</div>';
        }
        
        // 计算子任务完成度（仅对daily计划显示进度条）
        let progressBarHtml = '';
        if (type === 'daily' && plan.subtasks.length > 0) {
            const completedCount = plan.subtasks.filter(subtask => subtask.completed).length;
            const completionPercentage = Math.round((completedCount / plan.subtasks.length) * 100);
            
            progressBarHtml = `
                <div class="mt-2">
                    <div class="flex justify-between text-xs text-gray-500 mb-1">
                        <span>完成进度</span>
                        <span>${completedCount}/${plan.subtasks.length} (${completionPercentage}%)</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-primary rounded-full h-2 transition-all duration-500 ease-out" style="width: ${completionPercentage}%"></div>
                    </div>
                </div>
            `;
        }
        
        // 为日计划添加特殊样式类
        const cardClass = type === 'daily' ? 'bg-gray-50 p-3 rounded-lg shadow-sm mb-3 transition-all hover:shadow-md daily-plan-card' : 'bg-gray-50 p-3 rounded-lg shadow-sm mb-3 transition-all hover:shadow-md';
        
        // 检查任务是否已完成
        const isCompleted = plan.completed || false;
        const taskTitleClass = isCompleted ? 'line-through text-gray-500 transition-all duration-300' : 'text-gray-800 transition-all duration-300';
        
        html += `
            <div class="${cardClass}">
                <div class="flex justify-between items-start">
                    <div class="flex items-center">
                        <input type="checkbox" class="mr-2 plan-checkbox" data-type="${type}" data-id="${plan.id}" ${isCompleted ? 'checked' : ''}>
                        <div>
                            <h4 class="font-medium ${taskTitleClass}">${plan.title}</h4>
                            <p class="text-xs mt-1 ${daysClass}">${daysText}</p>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button class="text-primary hover:text-primary/80 edit-plan" data-type="${type}" data-id="${plan.id}">
                            <i class="fa fa-pencil"></i>
                        </button>
                        <button class="text-red-500 hover:text-red-700 delete-plan" data-type="${type}" data-id="${plan.id}">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${subtasksHtml}
                ${progressBarHtml}
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // 为动态添加的元素添加事件监听器
    attachDynamicEventListeners(type);
}

// 删除计划
function deletePlan(type, id) {
    if (confirm('确定要删除这个计划吗？')) {
        plansData[type] = plansData[type].filter(plan => plan.id !== id);
        localStorage.setItem('plansData', JSON.stringify(plansData));
        renderPlans(type);
    }
}

// 编辑计划
function editPlan(type, id) {
    const plan = plansData[type].find(p => p.id === id);
    if (!plan) return;
    
    planType.value = type;
    planId.value = plan.id;
    planTitle.value = plan.title;
    planDeadline.value = plan.deadline;
    
    // 获取截止时间输入框的父容器
    const deadlineContainer = planDeadline.parentElement;
    
    // 年计划隐藏截止时间编辑，其他计划显示
    if (type === 'year') {
        if (deadlineContainer) {
            deadlineContainer.classList.add('hidden');
        }
    } else {
        if (deadlineContainer) {
            deadlineContainer.classList.remove('hidden');
        }
    }
    
    // 设置模态框标题
    const typeText = type === 'week' ? '周' : type === 'month' ? '月' : type === 'year' ? '年' : '日';
    planModalTitle.textContent = `编辑${typeText}计划`;
    
    // 渲染子任务
    subtasksContainer.innerHTML = '';
    if (plan.subtasks.length === 0) {
        // 如果没有子任务，添加一个空的
        addSubtask();
    } else {
        plan.subtasks.forEach(subtask => {
            const subtaskItem = document.createElement('div');
            subtaskItem.className = 'flex items-center subtask-item';
            subtaskItem.innerHTML = `
                <input type="text" class="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50" value="${subtask.text}">
                <button type="button" class="ml-2 text-red-500 hover:text-red-700 remove-subtask">
                    <i class="fa fa-minus-circle"></i>
                </button>
            `;
            subtasksContainer.appendChild(subtaskItem);
        });
    }
    
    // 显示模态框
    planFormModal.classList.remove('hidden');
    
    // 重新添加删除子任务的事件监听器
    addEventListeners();
}

// 更新子任务完成状态
function updateSubtaskStatus(type, planId, subtaskIndex, completed) {
    const plan = plansData[type].find(p => p.id === planId);
    if (plan && plan.subtasks[subtaskIndex] !== undefined) {
        plan.subtasks[subtaskIndex].completed = completed;
        
        // 检查并更新任务完成状态（当日计划时）
        let statusChanged = false;
        if (type === 'daily') {
            statusChanged = checkAndUpdatePlanStatus(type, planId);
        }
        
        // 仅在数据变更时保存一次
        localStorage.setItem('plansData', JSON.stringify(plansData));
        
        // 添加微动画效果
        const container = document.getElementById(`${type}-tasks`) || document.getElementById(`${type}-plans`);
        if (container) {
            const planItem = container.querySelector(`[data-id="${planId}"]`);
            if (planItem) {
                planItem.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    planItem.style.transform = '';
                    renderPlans(type);
                }, 150);
            } else {
                renderPlans(type);
            }
        } else {
            renderPlans(type);
        }
    }
}

// 检查并更新计划完成状态，返回是否有状态变更
function checkAndUpdatePlanStatus(type, planId) {
    const plan = plansData[type].find(p => p.id === planId);
    if (plan && plan.subtasks.length > 0) {
        const completedCount = plan.subtasks.filter(subtask => subtask.completed).length;
        const isAllCompleted = completedCount === plan.subtasks.length;
        const wasCompleted = plan.completed || false;
        
        // 更新大任务状态：所有子任务完成时标记为完成，否则标记为未完成
        if (isAllCompleted && !wasCompleted) {
            plan.completed = true;
            return true;
        } else if (!isAllCompleted && wasCompleted) {
            plan.completed = false;
            return true;
        }
    }
    return false;
}

// 更新计划完成状态
function updatePlanCompletionStatus(type, planId, completed) {
    const plan = plansData[type].find(p => p.id === planId);
    if (plan) {
        plan.completed = completed;
        
        // 对所有类型的计划，同步更新所有子任务状态
        plan.subtasks.forEach(subtask => {
            subtask.completed = completed;
        });
        
        localStorage.setItem('plansData', JSON.stringify(plansData));
        renderPlans(type);
    }
}

// 添加所有必要的事件监听器
function addEventListeners() {
    // 打开计划编辑模态框
    if (addWeekPlanBtn) addWeekPlanBtn.addEventListener('click', () => openPlanModal('week'));
    if (addMonthPlanBtn) addMonthPlanBtn.addEventListener('click', () => openPlanModal('month'));
    if (addYearPlanBtn) addYearPlanBtn.addEventListener('click', () => openPlanModal('year'));
    if (addDailyPlanBtn) addDailyPlanBtn.addEventListener('click', () => openPlanModal('daily'));
    
    // 关闭模态框
    if (closePlanModalBtn) closePlanModalBtn.addEventListener('click', closePlanModal);
    if (cancelPlanBtn) cancelPlanBtn.addEventListener('click', closePlanModal);
    
    // 保存计划
    if (savePlanBtn) savePlanBtn.addEventListener('click', savePlan);
    
    // 添加子任务
    if (addSubtaskBtn) addSubtaskBtn.addEventListener('click', addSubtask);
    
    // 删除子任务（使用事件委托或在每次添加子任务时绑定）
    subtasksContainer.addEventListener('click', function(e) {
        if (e.target.closest('.remove-subtask')) {
            const btn = e.target.closest('.remove-subtask');
            const subtaskItem = btn.closest('.subtask-item');
            if (subtasksContainer.children.length > 1) {
                subtaskItem.remove();
            }
        }
    });
    
    // 点击模态框外部关闭
    planFormModal.addEventListener('click', function(e) {
        if (e.target === planFormModal) {
            closePlanModal();
        }
    });
}

// 为动态生成的元素添加事件监听器
function attachDynamicEventListeners(type) {
    let container;
    switch (type) {
        case 'week':
            container = weekTasksContainer;
            break;
        case 'month':
            container = monthTasksContainer;
            break;
        case 'year':
            container = yearTasksContainer;
            break;
        case 'daily':
            container = dailyPlansContainer;
            break;
        default:
            return;
    }
    
    // 编辑计划
    container.querySelectorAll('.edit-plan').forEach(btn => {
        btn.addEventListener('click', function() {
            const planType = this.getAttribute('data-type');
            const planId = this.getAttribute('data-id');
            editPlan(planType, planId);
        });
    });
    
    // 删除计划
    container.querySelectorAll('.delete-plan').forEach(btn => {
        btn.addEventListener('click', function() {
            const planType = this.getAttribute('data-type');
            const planId = this.getAttribute('data-id');
            deletePlan(planType, planId);
        });
    });
    
    // 更新子任务完成状态
    container.querySelectorAll('.subtask-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const planId = this.getAttribute('data-plan-id');
            const subtaskIndex = parseInt(this.getAttribute('data-subtask-index'));
            updateSubtaskStatus(type, planId, subtaskIndex, this.checked);
        });
    });
    
    // 更新计划完成状态
    container.querySelectorAll('.plan-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const planType = this.getAttribute('data-type');
            const planId = this.getAttribute('data-id');
            updatePlanCompletionStatus(planType, planId, this.checked);
        });
    });
}

// 在init函数中初始化计划功能
function initPlans() {
    initPlansData();
    addEventListeners();
}

// 计划功能已在init函数中正确初始化

// AI聊天窗口相关函数
function initAiChatWindow() {
    // 安全检查，确保DOM元素存在
    // 检查是否存在聊天窗口元素
    if (!document.getElementById('ai-chat-container')) {
        console.warn('AI聊天窗口元素未找到，初始化跳过');
        return;
    }
    
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-message-btn');
    const messagesContainer = document.getElementById('chat-messages');
    const minimizeBtn = document.getElementById('minimize-chat-btn');
    const clearBtn = document.getElementById('clear-chat-btn');
    
    // 添加API开关控件
    function createApiToggleControl() {
        // 检查是否已经存在API控制区域
        if (document.getElementById('api-control-container')) {
            return; // 已存在，不需要重复创建
        }
        
        const chatContainer = document.getElementById('ai-chat-container');
        const header = chatContainer.querySelector('.bg-primary.text-white');
        
        if (!header) return;
        
        const controlContainer = document.createElement('div');
        controlContainer.id = 'api-control-container';
        controlContainer.className = 'p-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-xs';
        
        const apiStatusContainer = document.createElement('div');
        apiStatusContainer.className = 'flex items-center gap-2';
        
        const apiIndicator = document.createElement('span');
        apiIndicator.id = 'api-status-indicator';
        apiIndicator.className = API_CONFIG.useApi && API_CONFIG.getApiKey() ? 
            'w-2 h-2 bg-green-500 rounded-full' : 
            'w-2 h-2 bg-gray-300 rounded-full';
        
        const apiStatusText = document.createElement('span');
        apiStatusText.id = 'api-status-text';
        apiStatusText.className = 'text-gray-600';
        apiStatusText.textContent = API_CONFIG.useApi && API_CONFIG.getApiKey() ? 
            'AI增强已启用' : (!API_CONFIG.getApiKey() ? '未配置API密钥' : 'AI增强已禁用');
        
        const apiToggle = document.createElement('label');
        apiToggle.className = 'relative inline-flex items-center cursor-pointer';
        apiToggle.innerHTML = `
            <input type="checkbox" id="api-toggle" class="sr-only" ${API_CONFIG.useApi ? 'checked' : ''}>
            <div class="w-9 h-5 bg-gray-200 rounded-full transition-colors duration-200 ${API_CONFIG.useApi ? 'bg-green-500' : ''}">
                <div class="w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${API_CONFIG.useApi ? 'translate-x-4' : 'translate-x-0.5'} mt-0.5"></div>
            </div>
        `;
        
        const toggleInput = apiToggle.querySelector('input');
        const toggleSlider = apiToggle.querySelector('div');
        const toggleDot = toggleSlider.querySelector('div');
        
        toggleInput.addEventListener('change', function() {
            API_CONFIG.useApi = this.checked;
            // 更新开关UI
            if (this.checked) {
                toggleSlider.classList.add('bg-green-500');
                toggleDot.classList.add('translate-x-4');
                toggleDot.classList.remove('translate-x-0.5');
            } else {
                toggleSlider.classList.remove('bg-green-500');
                toggleDot.classList.remove('translate-x-4');
                toggleDot.classList.add('translate-x-0.5');
            }
            updateApiStatusUI();
        });
        
        apiStatusContainer.appendChild(apiIndicator);
        apiStatusContainer.appendChild(apiStatusText);
        controlContainer.appendChild(apiStatusContainer);
        controlContainer.appendChild(apiToggle);
        
        // 添加API密钥配置按钮
        const apiConfigBtn = document.createElement('button');
        apiConfigBtn.className = 'text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors ml-2';
        apiConfigBtn.textContent = '配置API';
        apiConfigBtn.onclick = showApiConfigModal;
        apiStatusContainer.appendChild(apiConfigBtn);
        
        // 插入到聊天窗口头部下方
        chatContainer.insertBefore(controlContainer, header.nextElementSibling);
    }
    
    // 更新API状态UI
    function updateApiStatusUI() {
        const apiIndicator = document.getElementById('api-status-indicator');
        const apiStatusText = document.getElementById('api-status-text');
        
        if (apiIndicator && apiStatusText) {
            if (API_CONFIG.useApi && API_CONFIG.getApiKey()) {
                apiIndicator.className = 'w-2 h-2 bg-green-500 rounded-full';
                apiStatusText.textContent = 'AI增强已启用';
            } else {
                apiIndicator.className = 'w-2 h-2 bg-gray-300 rounded-full';
                if (!API_CONFIG.getApiKey()) {
                    apiStatusText.textContent = '未配置API密钥';
                } else {
                    apiStatusText.textContent = 'AI增强已禁用';
                }
            }
        }
    }
    
    // 显示API配置模态框
    function showApiConfigModal() {
        // 创建模态框背景
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        // 创建模态框内容
        const modal = document.createElement('div');
        modal.className = 'bg-white rounded-lg shadow-lg p-5 w-full max-w-sm';
        modal.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">配置AI API</h3>
                <button id="close-api-modal" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">API密钥</label>
                <input type="password" id="api-key-input" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="输入您的API密钥">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">API端点</label>
                <input type="text" id="api-endpoint-input" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50" value="${escapeHtml(API_CONFIG.endpoint)}">
            </div>
            <div class="flex justify-end gap-2">
                <button id="cancel-api-config" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">取消</button>
                <button id="save-api-config" class="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors">保存</button>
            </div>
        `;
        
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        
        // 填充当前API密钥
        const apiKeyInput = document.getElementById('api-key-input');
        if (apiKeyInput) {
            apiKeyInput.value = API_CONFIG.getApiKey();
        }
        
        // 添加关闭事件
        document.getElementById('close-api-modal').addEventListener('click', function() {
            document.body.removeChild(modalOverlay);
        });
        
        document.getElementById('cancel-api-config').addEventListener('click', function() {
            document.body.removeChild(modalOverlay);
        });
        
        // 添加保存事件
        document.getElementById('save-api-config').addEventListener('click', function() {
            const apiKey = apiKeyInput.value;
            const apiEndpoint = document.getElementById('api-endpoint-input').value;
            
            // 保存配置
            API_CONFIG.setApiKey(apiKey);
            if (apiEndpoint.trim()) {
                API_CONFIG.endpoint = apiEndpoint.trim();
            }
            
            // 更新状态UI
            updateApiStatusUI();
            
            // 关闭模态框
            document.body.removeChild(modalOverlay);
            
            // 显示保存成功提示
            showNotification('API配置已保存');
        });
        
        // 点击背景关闭
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
            }
        });
    }
    
    // 显示通知
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // 简单的淡入效果
        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, 3000);
    }
    
    // 创建API控制
    createApiToggleControl();
    
    // HTML转义函数，防止XSS攻击
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // 防抖函数，防止快速重复发送
        let debounceTimer;
        function debounce(func, wait) {
            return function() {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => func.apply(this, arguments), wait);
            };
        }
        
        // 发送消息功能
        function sendMessage() {
            const message = chatInput.value.trim();
            if (message === '') return;
            
            // 输入长度验证
            if (message.length > 500) {
                showErrorMessage('消息长度不能超过500个字符');
                return;
            }
            
            // 禁用输入和发送按钮，防止重复发送
            chatInput.disabled = true;
            sendBtn.disabled = true;
            sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
            
            // 添加用户消息到聊天窗口
            addUserMessage(message);
            chatInput.value = '';
            
            // 显示加载状态
            addLoadingMessage();
            
            // 创建一个异步函数来处理AI回复，确保异步处理不会影响主界面
            (async function processAiResponse() {
                try {
                    // 记录开始时间，用于性能监控
                    const startTime = Date.now();
                    
                    // 对于API模式，移除额外的延迟，让真实API响应决定等待时间
                    // 对于本地模式，保留1-2秒的延迟以模拟真实思考过程
                    let responseDelay = 0;
                    if (!API_CONFIG.useApi || !API_CONFIG.getApiKey()) {
                        responseDelay = 1000 + Math.random() * 1000;
                    }
                    
                    if (responseDelay > 0) {
                        await new Promise(resolve => setTimeout(resolve, responseDelay));
                    }
                    
                    // 移除加载状态
                    removeLoadingMessage();
                    
                    // 根据用户输入异步生成AI回复
                    // 添加错误边界处理，确保API调用失败不会影响应用
                    try {
                        const aiResponse = await generateAiResponse(message);
                        // 检查响应是否有效
                        if (aiResponse && typeof aiResponse === 'string' && aiResponse.trim()) {
                            addAiMessage(aiResponse);
                        } else {
                            // 如果响应无效，使用默认回复
                            addAiMessage('抱歉，我无法为您提供有效的回复。请尝试重新表述您的问题。');
                        }
                    } catch (apiError) {
                        // API调用失败时的详细错误处理
                        console.error('API调用失败:', apiError);
                        
                        // 根据错误类型提供更具体的反馈
                        let errorMessage = '抱歉，我在处理您的请求时遇到了问题。';
                        
                        if (API_CONFIG.useApi && !API_CONFIG.getApiKey()) {
                            errorMessage += ' 请配置API密钥或禁用AI增强功能。';
                        } else if (apiError.name === 'AbortError') {
                            errorMessage += ' 请求超时，请重试。';
                        } else if (apiError.message && apiError.message.includes('Network')) {
                            errorMessage += ' 网络连接问题，请检查您的网络设置。';
                        } else if (apiError.response && apiError.response.status === 401) {
                            errorMessage += ' API密钥无效，请重新配置。';
                        }
                        
                        addAiMessage(errorMessage);
                    }
                    
                    // 性能监控
                    const endTime = Date.now();
                    console.log(`AI响应处理时间: ${endTime - startTime}ms`);
                } catch (error) {
                    // 捕获所有可能的错误，确保UI不会卡住
                    console.error('处理AI回复时发生严重错误:', error);
                    handleAiResponseError(error);
                } finally {
                    // 无论如何都要恢复按钮状态，防止UI卡住
                    try {
                        chatInput.disabled = false;
                        sendBtn.disabled = false;
                        sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                        chatInput.focus();
                    } catch (uiError) {
                        console.error('恢复UI状态时出错:', uiError);
                    }
                }
            })();
        }
        
        // 显示错误消息
        function showErrorMessage(message) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'flex items-center justify-center mb-2';
            errorDiv.innerHTML = `
                <div class="bg-red-50 text-red-600 text-xs px-3 py-1.5 rounded-full animate-fade-in">
                    ${message}
                </div>
            `;
            
            // 插入到输入框上方
            const inputContainer = document.querySelector('#ai-chat-container .flex.space-x-2');
            inputContainer.parentNode.insertBefore(errorDiv, inputContainer);
            
            // 3秒后自动移除错误消息
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.classList.add('animate-fade-out');
                    setTimeout(() => {
                        if (errorDiv.parentNode) {
                            errorDiv.parentNode.removeChild(errorDiv);
                        }
                    }, 300);
                }
            }, 3000);
        }
        
        // 处理AI回复错误
        function handleAiResponseError(error) {
            // 移除加载状态
            removeLoadingMessage();
            
            // 添加错误提示消息
            let errorMessage = '抱歉，我在处理您的请求时遇到了问题。';
            
            // 检查是否启用了API但没有配置密钥
            if (API_CONFIG.useApi && !API_CONFIG.getApiKey()) {
                errorMessage += ' 您可以在设置中配置API密钥或禁用AI增强功能。';
            } else if (!API_CONFIG.useApi) {
                errorMessage += ' 请稍后重试。';
            }
            
            addAiMessage(errorMessage);
            console.error('AI回复错误:', error);
        }
        
        // 为清空按钮添加功能
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                if (confirm('确定要清空所有聊天记录吗？')) {
                    messagesContainer.innerHTML = '';
                }
            });
        }
    
    // 添加用户消息
        function addUserMessage(text) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'flex items-start justify-end space-x-2 opacity-0 transform translate-y-2 transition-all duration-300';
            messageDiv.innerHTML = `
                <div class="bg-aiChat-userBg p-2 rounded-lg rounded-tr-none max-w-[85%] shadow-sm">
                    <p class="text-aiChat-userText text-sm">${escapeHtml(text)}</p>
                </div>
                <div class="w-7 h-7 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-white text-xs">
                    <i class="fa fa-user"></i>
                </div>
            `;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // 添加动画效果
            setTimeout(() => {
                messageDiv.classList.remove('opacity-0', 'translate-y-2');
            }, 10);
        }
        
        // 添加AI消息
        function addAiMessage(text) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'flex items-start space-x-2 opacity-0 transform translate-y-2 transition-all duration-300';
            
            // 处理换行符，转换为HTML格式
            const formattedText = escapeHtml(text).replace(/\n/g, '<br>');
            
            messageDiv.innerHTML = `
                <div class="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-xs">
                    <i class="fa fa-robot"></i>
                </div>
                <div class="bg-aiChat-botBg p-2 rounded-lg rounded-tl-none max-w-[85%] shadow-sm">
                    <p class="text-aiChat-botText text-sm">${formattedText}</p>
                </div>
            `;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // 添加动画效果
            setTimeout(() => {
                messageDiv.classList.remove('opacity-0', 'translate-y-2');
            }, 10);
        }
        
        // 添加加载状态
        function addLoadingMessage() {
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'loading-message';
            loadingDiv.className = 'flex items-start space-x-2 opacity-0 transform translate-y-2 transition-all duration-300';
            loadingDiv.innerHTML = `
                <div class="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-xs">
                    <i class="fa fa-robot"></i>
                </div>
                <div class="bg-aiChat-botBg p-2 rounded-lg rounded-tl-none max-w-[85%] shadow-sm">
                    <div class="flex space-x-1.5">
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                    </div>
                </div>
            `;
            messagesContainer.appendChild(loadingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // 添加动画效果
            setTimeout(() => {
                loadingDiv.classList.remove('opacity-0', 'translate-y-2');
            }, 10);
        }
    
    // 移除加载状态
    function removeLoadingMessage() {
        const loadingDiv = document.getElementById('loading-message');
        if (loadingDiv) {
            messagesContainer.removeChild(loadingDiv);
        }
    }
    
    // 清空聊天历史
    function clearChatHistory() {
        messagesContainer.innerHTML = '';
        // 重新添加欢迎消息
        addAiMessage('您好！我是您的智能任务助手。请告诉我您需要完成的任务，我可以帮您拆分任务、给出安排建议，让您的时间规划更加高效有序。');
    }
    
    // 最小化/恢复聊天窗口
    let isMinimized = false;
    function toggleMinimize() {
        const chatMessages = document.getElementById('chat-messages');
        const inputArea = document.querySelector('#ai-chat-container .flex.space-x-2');
        
        if (isMinimized) {
            chatMessages.style.display = 'block';
            inputArea.style.display = 'flex';
            minimizeBtn.innerHTML = '<i class="fa fa-window-minimize"></i>';
        } else {
            chatMessages.style.display = 'none';
            inputArea.style.display = 'none';
            minimizeBtn.innerHTML = '<i class="fa fa-window-maximize"></i>';
        }
        isMinimized = !isMinimized;
    }
    
    // 事件监听器
        if (sendBtn) sendBtn.addEventListener('click', debounce(sendMessage, 300));
        if (chatInput) chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                debounce(sendMessage, 300)();
            }
        });
        if (minimizeBtn) minimizeBtn.addEventListener('click', toggleMinimize);
        if (clearBtn) clearBtn.addEventListener('click', clearChatHistory);
        
        // 窗口大小变化时调整聊天窗口高度
        window.addEventListener('resize', function() {
            adjustChatWindowHeight();
        });
        
        // 初始调整聊天窗口高度
        adjustChatWindowHeight();
        
        // 根据窗口大小调整聊天窗口高度
        function adjustChatWindowHeight() {
            if (window.innerWidth < 768) {
                messagesContainer.style.height = '150px';
            } else {
                messagesContainer.style.height = '200px';
            }
        }
    
    // 初始化时显示欢迎消息
    if (messagesContainer) {
        clearChatHistory();
    }
}

// 生成AI回复的函数
// API配置常量
const API_CONFIG = {
    // 这里使用占位符，实际使用时需要替换为真实的API地址
    endpoint: 'https://api.example.com/v1/chat/completions',
    // API密钥存储在localStorage中，用户需要在界面上配置
    getApiKey: function() {
        return localStorage.getItem('aiChatApiKey') || '';
    },
    // 设置API密钥
    setApiKey: function(key) {
        localStorage.setItem('aiChatApiKey', key);
    },
    // 请求超时时间（毫秒）
    timeout: 30000,
    // 是否使用API（可以切换回本地模式）
    useApi: true,
    // 默认模型
    model: 'gpt-3.5-turbo'
};

// 用户输入预处理函数
function preprocessUserInput(userInput) {
    // 去除多余空格和换行符
    const processedInput = userInput.trim();
    
    // 简单输入的关键词列表，这些情况下可以使用本地回复
    const simpleKeywords = [
        '帮助', '使用方法', '怎么用', '使用说明', '教程',
        '你好', '嗨', '早上好', '晚上好', '中午好',
        '再见', '拜拜', '下次见',
        '谢谢', '感谢', 'thank', 'thanks'
    ];
    
    // 检查是否为简单输入
    const isSimpleInput = simpleKeywords.some(keyword => 
        processedInput.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // 复杂输入模式检测
    const complexityPatterns = {
        hasMultiPartRequest: /[,，。]|和|与|并且/.test(processedInput), // 包含多个部分的请求
        hasComplexKeywords: /(任务|计划|安排|分解|步骤|如何|实现|完成|准备|学习|复习|项目|报告|论文|作业|方案)/.test(processedInput), // 包含复杂任务关键词
        isLongRequest: processedInput.length > 30, // 较长的请求
        hasQuestionMarks: processedInput.includes('?') || processedInput.includes('？'), // 包含问题
        hasDateReferences: /(今天|明天|本周|下周|这个月|下个月|具体日期|截止日期|期限|时间节点)/.test(processedInput) // 包含日期引用
    };
    
    // 计算复杂度分数
    let complexityScore = 0;
    for (const [key, value] of Object.entries(complexityPatterns)) {
        if (value) complexityScore++;
    }
    
    // 确定是否需要使用API
    const shouldUseApi = complexityScore >= 2 && !isSimpleInput;
    
    // 对于复杂输入，进行增强处理以获得更好的API响应
    let enhancedInput = processedInput;
    if (shouldUseApi) {
        // 添加任务规划的具体要求
        enhancedInput += '\n\n请帮我将这个目标分解成具体的、可执行的任务步骤，并为每个步骤提供合理的时间估计和优先级建议。请使用清晰的结构和编号来组织任务。';
    }
    
    return {
        originalInput: userInput,
        processedInput: processedInput,
        enhancedInput: enhancedInput,
        shouldUseApi: shouldUseApi,
        complexityScore: complexityScore,
        complexityDetails: complexityPatterns
    };
}

// 发送API请求的函数（带重试机制）
async function sendApiRequest(userInput) {
    // 检查是否配置了API密钥
    const apiKey = API_CONFIG.getApiKey();
    if (!apiKey) {
        throw new Error('请先配置API密钥');
    }
    
    // 检查是否启用了API
    if (!API_CONFIG.useApi) {
        // 回退到本地生成响应
        return generateLocalResponse(userInput);
    }
    
    // 构建请求参数
    const requestData = {
        model: API_CONFIG.model,
        messages: [
            {
                role: 'system',
                content: '你是一个智能任务规划助手，擅长帮助用户拆分和规划复杂任务。请提供清晰、有条理的任务拆分和时间规划建议。'
            },
            {
                role: 'user',
                content: userInput
            }
        ],
        temperature: 0.7,
        max_tokens: 1500
    };
    
    // 重试配置
    const maxRetries = 3;
    const retryDelayBase = 1000; // 基础延迟时间（毫秒）
    let retries = 0;
    
    // 执行请求的内部函数
    async function executeRequest() {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', API_CONFIG.endpoint, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
            
            // 设置超时
            xhr.timeout = API_CONFIG.timeout;
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response.choices && response.choices.length > 0 && response.choices[0].message) {
                            resolve(response.choices[0].message.content);
                        } else {
                            reject(new Error('API返回格式不正确'));
                        }
                    } catch (error) {
                        reject(new Error('解析API响应失败: ' + error.message));
                    }
                } else {
                    // 某些错误状态码可以重试，如500、502、503、504
                    const retryableStatusCodes = [500, 502, 503, 504];
                    const error = new Error(`API请求失败: HTTP ${xhr.status} - ${xhr.statusText}`);
                    
                    if (retryableStatusCodes.includes(xhr.status) && retries < maxRetries) {
                        error.retryable = true;
                    }
                    
                    reject(error);
                }
            };
            
            xhr.onerror = function() {
                // 网络错误通常是可以重试的
                const error = new Error('网络错误，无法连接到API服务器');
                error.retryable = retries < maxRetries;
                reject(error);
            };
            
            xhr.ontimeout = function() {
                // 超时错误通常是可以重试的
                const error = new Error('API请求超时，请稍后重试');
                error.retryable = retries < maxRetries;
                reject(error);
            };
            
            // 发送请求
            xhr.send(JSON.stringify(requestData));
        });
    }
    
    // 带有指数退避的重试逻辑
    while (true) {
        try {
            return await executeRequest();
        } catch (error) {
            if (error.retryable && retries < maxRetries) {
                retries++;
                // 指数退避策略：基础延迟 * (2 ^ (重试次数 - 1)) + 随机抖动
                const delay = retryDelayBase * Math.pow(2, retries - 1) + Math.random() * 1000;
                console.warn(`API请求失败，将在${Math.round(delay)}ms后重试 (${retries}/${maxRetries}):`, error.message);
                
                // 等待延迟时间
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // 达到最大重试次数或错误不可重试
                if (retries > 0) {
                    error.message = `在尝试${retries+1}次后失败: ${error.message}`;
                }
                throw error;
            }
        }
    }
}

// 原有的生成AI回复的函数重命名为generateLocalResponse，作为回退方案
function generateLocalResponse(userInput) {
    const lowerInput = userInput.toLowerCase();
    
    // 关键词匹配
    if (containsTaskKeywords(lowerInput)) {
        return generateTaskBreakdown(lowerInput);
    } else if (lowerInput.includes('帮助') || lowerInput.includes('怎么用')) {
        return '我是您的智能任务助手，您可以：\n1. 告诉我您需要完成的任务，我会帮您拆分\n2. 询问如何规划时间\n3. 请求任务优先级建议\n\n请输入您的任务描述，例如："完成项目报告"或"准备考试"。';
    } else if (lowerInput.includes('优先级') || lowerInput.includes('重要')) {
        return '根据任务管理方法，您可以按照以下标准判断优先级：\n1. 紧急且重要：立即处理\n2. 重要不紧急：计划处理\n3. 紧急不重要：授权他人或减少时间\n4. 不紧急不重要：考虑放弃\n\n您可以告诉我具体任务，我来帮您评估优先级。';
    } else if (lowerInput.includes('你好') || lowerInput.includes('hi') || lowerInput.includes('hello')) {
        return '您好！很高兴为您提供帮助。请告诉我您需要完成的任务，我可以帮您拆分并提供安排建议。';
    } else {
        return '抱歉，我不太理解您的需求。请尝试描述您需要完成的任务，我会尽力帮您拆分和规划。';
    }
}

// 生成AI回复的函数（现在是异步函数）
async function generateAiResponse(userInput) {
    try {
        // 预处理用户输入
        const preprocessed = preprocessUserInput(userInput);
        console.log('用户输入预处理结果:', preprocessed);
        
        // 根据输入复杂度决定是否调用API
        if (preprocessed.shouldUseApi && API_CONFIG.useApi && API_CONFIG.getApiKey()) {
            console.log('使用API处理复杂输入');
            // 使用增强后的输入调用API
            const apiResponse = await sendApiRequest(preprocessed.enhancedInput);
            return apiResponse;
        } else {
            console.log('使用本地响应处理简单输入');
            // 简单输入使用本地响应
            return generateLocalResponse(preprocessed.processedInput);
        }
    } catch (error) {
        console.warn('处理失败，回退到本地响应:', error.message);
        // 发生错误时回退到本地生成响应
        return generateLocalResponse(userInput);
    }
}

// 检查是否包含任务关键词
function containsTaskKeywords(text) {
    const taskKeywords = ['完成', '准备', '写', '做', '整理', '学习', '复习', '计划', '项目', '报告', '论文', '作业', '考试', '会议', 'ppt', '演讲'];
    return taskKeywords.some(keyword => text.includes(keyword));
}

// 生成任务拆分
function generateTaskBreakdown(taskInput) {
    // 基于常见任务类型的模板
    if (taskInput.includes('报告') || taskInput.includes('论文') || taskInput.includes('文档')) {
        return `我建议将您的文档任务拆分为以下步骤：\n\n1. 收集资料（25%）\n   - 确定信息来源\n   - 整理参考资料\n   - 记录关键数据\n\n2. 大纲制定（15%）\n   - 确定文档结构\n   - 列出主要章节\n   - 分配各部分内容\n\n3. 内容撰写（40%）\n   - 分章节逐步完成\n   - 关注逻辑连贯\n   - 确保重点突出\n\n4. 修订完善（20%）\n   - 检查语法错误\n   - 优化表达\n   - 调整格式\n\n建议您可以将这些任务添加到时间规划器中，合理分配时间。您希望我为这些子任务估算时间吗？`;
    }
    
    if (taskInput.includes('考试') || taskInput.includes('复习')) {
        return `考试复习计划建议：\n\n1. 知识梳理（20%）\n   - 整理考试范围\n   - 列出重点难点\n   - 建立知识框架\n\n2. 系统复习（40%）\n   - 按章节/主题复习\n   - 做笔记和思维导图\n   - 理解核心概念\n\n3. 练习巩固（25%）\n   - 做练习题\n   - 模拟考试\n   - 错题分析\n\n4. 查漏补缺（15%）\n   - 复习薄弱环节\n   - 记忆关键信息\n   - 调整状态\n\n您可以根据考试日期，将这些任务合理分配到您的时间规划表中。`;
    }
    
    if (taskInput.includes('项目') || taskInput.includes('开发')) {
        return `项目任务拆分建议：\n\n1. 需求分析（15%）\n   - 明确项目目标\n   - 确定功能需求\n   - 识别约束条件\n\n2. 规划设计（20%）\n   - 制定项目计划\n   - 设计系统架构\n   - 分配任务责任\n\n3. 开发实现（45%）\n   - 核心功能开发\n   - 子模块集成\n   - 持续测试\n\n4. 测试优化（15%）\n   - 功能测试\n   - 性能优化\n   - 文档完善\n\n5. 交付上线（5%）\n   - 最终检查\n   - 部署发布\n\n建议您根据项目时间线，在规划器中设置里程碑和检查点。`;
    }
    
    // 通用任务拆分模板
    return `根据您的描述，我建议将任务拆分为以下几个步骤：\n\n1. 准备阶段\n   - 明确任务目标和要求\n   - 收集必要的资源和信息\n   - 制定初步计划\n\n2. 执行阶段\n   - 按优先级完成主要工作\n   - 定期检查进度\n   - 及时调整计划\n\n3. 完成阶段\n   - 审核成果质量\n   - 确保满足所有要求\n   - 总结经验教训\n\n您可以将这些步骤添加到时间规划器中，并根据实际情况调整时间分配。需要我为这些任务提供更详细的建议吗？`;
}

// 初始化功能选择窗口
function initFeatureWindow() {
    // DOM元素引用 - 适配新的HTML结构
    const taskPlanningBtn = document.getElementById('task-planning-btn');
    const taskReviewBtn = document.getElementById('task-review-btn');
    const reviewHistoryBtn = document.getElementById('review-history-btn');
    const taskReviewModal = document.getElementById('task-review-modal');
    const historyModal = document.getElementById('history-modal');
    const closeReviewModalBtn = document.getElementById('close-review-modal');
    const closeHistoryModalBtn = document.getElementById('close-history-modal');
    const customDateRange = document.getElementById('custom-date-range');
    const customRangeBtn = document.getElementById('custom-range-btn');
    const generateCustomReportBtn = document.getElementById('generate-custom-report');
    const historyDateInput = document.getElementById('history-date');
    const viewHistoryBtn = document.getElementById('view-history-btn');
    const reportContainer = document.getElementById('report-container');
    const historyContainer = document.getElementById('history-container');
    
    // 初始化日期选择器为今天
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    if (historyDateInput) historyDateInput.value = formattedDate;
    
    // 任务规划功能 - 跳转到指定网址
    if (taskPlanningBtn) {
        taskPlanningBtn.addEventListener('click', function() {
            window.open('https://doubao.com/bot/XxWWn9xW', '_blank');
        });
    }
    
    // 任务复盘功能 - 打开弹窗
    if (taskReviewBtn && taskReviewModal) {
        taskReviewBtn.addEventListener('click', function() {
            taskReviewModal.classList.remove('hidden');
            // 清空报告容器
            if (reportContainer) reportContainer.innerHTML = '';
            // 隐藏自定义日期范围
            if (customDateRange) customDateRange.classList.add('hidden');
        });
    }
    
    // 回顾往日功能 - 打开弹窗
    if (reviewHistoryBtn && historyModal) {
        reviewHistoryBtn.addEventListener('click', function() {
            historyModal.classList.remove('hidden');
            // 清空历史容器
            if (historyContainer) {
                historyContainer.innerHTML = '<p class="text-gray-500 text-center py-4">正在加载日计划...</p>';
            }
            // 设置默认日期为今天
            if (historyDateInput) historyDateInput.value = formattedDate;
            // 自动加载并显示当天的日计划
            showDailyPlan(formattedDate);
        });
    }
    
    // 关闭任务复盘弹窗
    if (closeReviewModalBtn && taskReviewModal) {
        closeReviewModalBtn.addEventListener('click', function() {
            taskReviewModal.classList.add('hidden');
        });
    }
    
    // 关闭回顾往日弹窗
    if (closeHistoryModalBtn && historyModal) {
        closeHistoryModalBtn.addEventListener('click', function() {
            historyModal.classList.add('hidden');
        });
    }
    
    // 点击弹窗外部关闭弹窗
    document.addEventListener('click', (e) => {
        if (taskReviewModal && e.target === taskReviewModal) {
            taskReviewModal.classList.add('hidden');
        }
        if (historyModal && e.target === historyModal) {
            historyModal.classList.add('hidden');
        }
    });
    
    // 时间范围选择按钮事件
    const rangeButtons = ['range-today', 'range-week', 'range-21days'];
    rangeButtons.forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', function() {
                let rangeText;
                switch(id) {
                    case 'range-today': rangeText = '今日'; break;
                    case 'range-week': rangeText = '近七天'; break;
                    case 'range-21days': rangeText = '近21天'; break;
                    default: rangeText = '';
                }
                if (rangeText) {
                    generateReviewReport(rangeText);
                }
            });
        }
    });
    
    // 自定义范围按钮点击事件
    if (customRangeBtn && customDateRange) {
        customRangeBtn.addEventListener('click', function() {
            customDateRange.classList.toggle('hidden');
        });
    }
    
    // 生成自定义报告
    if (generateCustomReportBtn) {
        generateCustomReportBtn.addEventListener('click', function() {
            const startDate = document.getElementById('custom-start-date')?.value;
            const endDate = document.getElementById('custom-end-date')?.value;
            
            if (startDate && endDate) {
                generateReviewReport(`${startDate} 至 ${endDate}`);
            } else {
                alert('请选择完整的时间范围');
            }
        });
    }
    
    // 查看历史日计划
    if (viewHistoryBtn && historyDateInput) {
        viewHistoryBtn.addEventListener('click', function() {
            const selectedDate = historyDateInput.value;
            if (selectedDate) {
                showDailyPlan(selectedDate);
            } else {
                alert('请选择日期');
            }
        });
    }
    
    // 生成复盘报告 - 连接日计划数据
    function generateReviewReport(timeRange) {
        // 从存储中获取任务数据 - 包括完成的任务和计划任务
        const tasksData = JSON.parse(localStorage.getItem('done_list_records') || '[]');
        const plansData = JSON.parse(localStorage.getItem('plansData') || '{}'); // 改为正确的键名
        const dailyPlans = plansData.daily || [];
        
        // 根据时间范围过滤任务
        let filteredTasks = [];
        let filteredPlans = [];
        const today = new Date();
        
        switch(timeRange) {
            case '今日':
                // 过滤今日完成的任务
                filteredTasks = tasksData.filter(task => {
                    const taskDate = new Date(task.completionTime);
                    return taskDate.toDateString() === today.toDateString();
                });
                // 过滤今日计划的任务
                filteredPlans = dailyPlans.filter(plan => {
                    const planDate = new Date(plan.deadline);
                    return planDate.toDateString() === today.toDateString();
                });
                break;
            case '近七天':
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(today.getDate() - 7);
                // 过滤近七天完成的任务
                filteredTasks = tasksData.filter(task => {
                    const taskDate = new Date(task.completionTime);
                    return taskDate >= sevenDaysAgo && taskDate <= today;
                });
                // 过滤近七天计划的任务
                filteredPlans = dailyPlans.filter(plan => {
                    const planDate = new Date(plan.deadline);
                    return planDate >= sevenDaysAgo && planDate <= today;
                });
                break;
            case '近21天':
                const twentyOneDaysAgo = new Date();
                twentyOneDaysAgo.setDate(today.getDate() - 21);
                // 过滤近21天完成的任务
                filteredTasks = tasksData.filter(task => {
                    const taskDate = new Date(task.completionTime);
                    return taskDate >= twentyOneDaysAgo && taskDate <= today;
                });
                // 过滤近21天计划的任务
                filteredPlans = dailyPlans.filter(plan => {
                    const planDate = new Date(plan.deadline);
                    return planDate >= twentyOneDaysAgo && planDate <= today;
                });
                break;
            default:
                // 自定义时间范围
                const dateRangeMatch = timeRange.match(/(\d{4}-\d{2}-\d{2}) 至 (\d{4}-\d{2}-\d{2})/);
                if (dateRangeMatch) {
                    const startDate = new Date(dateRangeMatch[1]);
                    const endDate = new Date(dateRangeMatch[2]);
                    // 过滤自定义范围完成的任务
                    filteredTasks = tasksData.filter(task => {
                        const taskDate = new Date(task.completionTime);
                        return taskDate >= startDate && taskDate <= endDate;
                    });
                    // 过滤自定义范围计划的任务
                    filteredPlans = dailyPlans.filter(plan => {
                        const planDate = new Date(plan.deadline);
                        return planDate >= startDate && planDate <= endDate;
                    });
                }
                break;
        }
        
        // 计算统计数据
        // 获取计划中的子任务总数
        const totalPlanned = filteredPlans.reduce((total, plan) => {
            // 只计算实际有文本内容的子任务
            let count = 0;
            if (plan.subtasks && Array.isArray(plan.subtasks)) {
                plan.subtasks.forEach(subtask => {
                    if (subtask && subtask.text && subtask.text.trim() !== '') {
                        count++;
                    }
                });
            }
            return total + count;
        }, 0);
        
        // 将完成的任务与计划任务进行匹配，计算实际完成率
        let matchedCompletedTasks = 0;
        if (totalPlanned > 0 && filteredTasks.length > 0) {
            // 提取所有计划子任务的标题
            const plannedSubtasks = [];
            filteredPlans.forEach(plan => {
                if (plan.subtasks && Array.isArray(plan.subtasks)) {
                    plan.subtasks.forEach(subtask => {
                        if (subtask && subtask.text && subtask.text.trim() !== '') {
                            plannedSubtasks.push(subtask.text.toLowerCase().trim());
                        }
                    });
                }
            });
            
            // 检查完成的任务是否与计划任务匹配
            matchedCompletedTasks = filteredTasks.filter(task => {
                if (!task || !task.name) return false;
                const taskNameLower = task.name.toLowerCase().trim();
                return plannedSubtasks.some(subtask => 
                    taskNameLower.includes(subtask) || 
                    subtask.includes(taskNameLower) ||
                    taskNameLower === subtask
                );
            }).length;
        }
        
        const totalCompleted = filteredTasks.length; // 只统计当前时间范围内的完成任务
        const completionRate = totalPlanned > 0 ? 
            Math.round((matchedCompletedTasks / totalPlanned) * 100) + '%' : 
            '0%';
        
        // 分析任务分类
        const categoryCounts = {};
        filteredTasks.forEach(task => {
            const category = task.category || '其他';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
        
        // 找出主要项目
        let mainProject = '无特定重点';
        let maxCount = 0;
        for (const [category, count] of Object.entries(categoryCounts)) {
            if (count > maxCount) {
                maxCount = count;
                mainProject = category;
            }
        }
        
        // 生成报告
        let reportHTML = `<div class="p-4 bg-white rounded-lg shadow-md animate-fade-in">
            <h3 class="text-lg font-semibold mb-2">${timeRange}任务复盘报告</h3>
            <p class="mb-2">${timeRange}共计划了 <span class="font-bold">${totalPlanned}</span> 项任务，完成了 <span class="font-bold text-green-600">${totalCompleted}</span> 项。</p>
            <p class="mb-2">其中计划内任务完成：<span class="font-bold text-blue-600">${matchedCompletedTasks}</span> 项。</p>
            <p class="mb-2">任务完成率：<span class="font-bold ${matchedCompletedTasks === 0 ? 'text-gray-500' : 'text-green-600'}">${completionRate}</span></p>`;
        
        if (totalCompleted > 0) {
            reportHTML += `<p class="mb-2">重点在 <span class="font-bold">${mainProject}</span> 项目上。</p>`;
            
            // 工作生活平衡分析
            const weekendTasks = filteredTasks.filter(task => {
                const taskDate = new Date(task.completionTime);
                const day = taskDate.getDay();
                return day === 0 || day === 6; // 周日或周六
            });
            
            const balanceStatus = weekendTasks.length < filteredTasks.length * 0.2 
                ? '休息得很充分，保持了良好的工作生活平衡' 
                : '周末也有一定工作量，可以考虑适当增加休息时间';
            
            reportHTML += `<p class="mb-2">周末${balanceStatus}。</p>`;
            
            // 显示任务完成情况详情
            reportHTML += `<div class="mt-4">
                <h4 class="font-medium mb-2">任务完成详情：</h4>
                <ul class="space-y-2">`;
            
            filteredTasks.slice(0, 5).forEach(task => {
                reportHTML += `<li class="flex items-center text-sm">
                    <span class="w-3 h-3 inline-block rounded-full mr-2" style="background-color: ${task.color || '#3B82F6'}"></span>
                    ${task.name} (${task.category || '其他'})
                </li>`;
            });
            
            if (filteredTasks.length > 5) {
                reportHTML += `<li class="text-sm text-gray-500">... 还有 ${filteredTasks.length - 5} 项任务</li>`;
            }
            
            reportHTML += `</ul>
            </div>`;
        } else if (totalPlanned > 0) {
            reportHTML += `<p class="text-amber-600 mb-2">计划了任务但尚未完成，继续加油！</p>`;
        } else {
            reportHTML += `<p class="text-gray-500">该时间段内没有计划或完成的任务记录。</p>`;
        }
        
        reportHTML += `</div>`;
        if (reportContainer) reportContainer.innerHTML = reportHTML;
    }
    
    // 显示日计划 - 从localStorage获取实际数据
    function showDailyPlan(date) {
        // 从存储中获取日计划数据 - 使用与initPlansData一致的键名
        const plansData = JSON.parse(localStorage.getItem('plansData') || '{}');
        const dailyPlans = plansData.daily || [];
        const tasksData = JSON.parse(localStorage.getItem('done_list_records') || '[]');
        const taskFeelings = JSON.parse(localStorage.getItem('taskFeelings') || '{}');
        
        // 过滤指定日期的计划和任务
        const targetDate = new Date(date);
        const formattedDate = targetDate.toISOString().split('T')[0];
        const dayPlans = dailyPlans.filter(plan => {
            const planDate = new Date(plan.deadline).toISOString().split('T')[0];
            return planDate === formattedDate;
        });
        
        // 过滤指定日期完成的任务
        const dayTasks = tasksData.filter(task => {
            const taskDate = new Date(task.completionTime).toISOString().split('T')[0];
            return taskDate === formattedDate;
        });
        
        // 格式化日期显示
        const displayDate = `${targetDate.getFullYear()}年${targetDate.getMonth() + 1}月${targetDate.getDate()}日`;
        
        // 显示日计划
        if (historyContainer) {
            // 创建历史HTML
            let historyHTML = `<div class="p-4 bg-white rounded-lg shadow-md animate-fade-in">
                <h3 class="text-lg font-semibold mb-3">${displayDate} 的回顾</h3>`;
            
            // 添加日计划部分
            if (dayPlans.length > 0) {
                historyHTML += `<div class="mb-6">
                    <h4 class="font-medium mb-3">日计划</h4>`;
                
                dayPlans.forEach(plan => {
                    // 计算完成进度
                    const totalSubtasks = plan.subtasks?.length || 0;
                    const completedSubtasks = plan.subtasks?.filter(sub => sub.completed).length || 0;
                    const progressPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
                    
                    historyHTML += `<div class="mb-4 border-l-4 border-blue-500 pl-3">
                        <h5 class="font-medium">${plan.title}</h5>
                        <p class="text-sm text-gray-600 mb-1">截止时间：${plan.deadline}</p>
                        ${totalSubtasks > 0 ? `<p class="text-sm text-gray-600 mb-2">完成进度：${completedSubtasks}/${totalSubtasks} (${progressPercentage}%)</p>` : ''}
                        ${plan.subtasks && plan.subtasks.length > 0 ? 
                            `<ul class="space-y-1">
                                ${plan.subtasks.map(subtask => `
                                    <li class="text-sm flex items-center">
                                        <input type="checkbox" disabled ${subtask.completed ? 'checked' : ''} class="mr-2">
                                        <span ${subtask.completed ? 'class="line-through text-gray-500"' : ''}>${subtask.text}</span>
                                    </li>
                                `).join('')}
                            </ul>` : 
                            '<p class="text-sm text-gray-500">无详细子任务</p>'
                        }
                    </div>`;
                });
                
                historyHTML += `</div>`;
            } else {
                historyHTML += `<div class="mb-6 p-3 bg-gray-50 rounded-md">
                    <p class="text-sm text-gray-500">该日期没有记录的日计划。</p>
                </div>`;
            }
            
            // 添加已完成任务和感受部分
            if (dayTasks.length > 0) {
                historyHTML += `<div class="mb-4">
                    <h4 class="font-medium mb-3 text-lg">完成事项</h4>
                    <div class="grid gap-4">`;
                
                dayTasks.forEach(task => {
                    const feeling = taskFeelings[task.id];
                    // 获取分类颜色
                    const categoryColors = {
                        '工作': 'bg-blue-50 border-blue-200',
                        '学习': 'bg-green-50 border-green-200',
                        '生活': 'bg-yellow-50 border-yellow-200',
                        '健康': 'bg-red-50 border-red-200',
                        '其他': 'bg-purple-50 border-purple-200'
                    };
                    const bgClass = categoryColors[task.category] || 'bg-gray-50 border-gray-200';
                    const borderClass = bgClass.split(' ')[1];
                    
                    historyHTML += `<div class="rounded-lg border ${borderClass} overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
                        <div class="${bgClass} px-4 py-3 border-b border-gray-100">
                            <div class="flex justify-between items-start">
                                <h5 class="font-medium text-gray-800">${task.name}</h5>
                                <span class="px-2 py-1 text-xs font-medium rounded-full bg-white border ${borderClass}">${task.category}</span>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">完成时间：${new Date(task.completionTime).toLocaleTimeString()}</p>
                        </div>
                        <div class="p-4 bg-white">
                            <p class="text-sm font-medium text-gray-600 mb-2 flex items-center">
                                <i class="fa fa-comment-o mr-1"></i> 感受记录
                            </p>
                            <div class="text-sm bg-gray-50 p-3 rounded-md min-h-[40px]">
                                ${feeling ? feeling : '<span class="text-gray-400 italic">暂无感受记录</span>'}
                            </div>
                        </div>
                    </div>`;
                });
                
                historyHTML += `</div></div>`;
            } else if (dayPlans.length === 0) {
                historyHTML += `<div class="p-3 bg-gray-50 rounded-md">
                    <p class="text-sm text-gray-500">该日期没有记录的完成事项。</p>
                </div>`;
            }
            
            historyHTML += `</div>`;
            historyContainer.innerHTML = historyHTML;
        }
    }
    
    // 绘制历史时间图表
    function drawHistoryClock(tasks, targetDate) {
        const canvas = document.getElementById('history-clock-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制圆形背景
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制更多小时标记
        for (let hour = 0; hour < 24; hour++) {
            const angle = (hour - 6) * (Math.PI / 12);
            
            // 小时数字标记 (每3小时显示一个)
            if (hour % 3 === 0) {
                const markerRadius = radius * 0.85;
                const x = centerX + Math.cos(angle) * markerRadius;
                const y = centerY + Math.sin(angle) * markerRadius;
                
                ctx.font = 'bold 12px Inter, sans-serif';
                ctx.fillStyle = '#4b5563';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(hour.toString(), x, y);
            } else {
                // 次要刻度线
                const innerRadius = radius * 0.9;
                const outerRadius = radius * 0.95;
                const x1 = centerX + Math.cos(angle) * innerRadius;
                const y1 = centerY + Math.sin(angle) * innerRadius;
                const x2 = centerX + Math.cos(angle) * outerRadius;
                const y2 = centerY + Math.sin(angle) * outerRadius;
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        
        // 计算总任务时长
        let totalDuration = 0;
        const categoryStats = {};
        
        // 绘制历史任务
        if (tasks && tasks.length > 0) {
            tasks.forEach(task => {
                // 计算任务开始和结束时间的角度
                const startHour = task.start;
                const endHour = task.end;
                const duration = endHour - startHour;
                totalDuration += duration;
                
                // 统计各分类时间
                if (task.category) {
                    categoryStats[task.category] = (categoryStats[task.category] || 0) + duration;
                }
                
                const startAngle = (startHour - 6) * (Math.PI / 12);
                const endAngle = (endHour - 6) * (Math.PI / 12);
                
                // 绘制任务扇形
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius * 0.75, startAngle, endAngle);
                ctx.closePath();
                
                // 填充颜色，保持半透明效果
                ctx.fillStyle = `${task.color}BF`;
                ctx.fill();
                
                // 添加任务名称（如果时间范围足够大）
                if (duration >= 0.5) { // 只有时长超过30分钟的任务才显示名称
                    const midAngle = (startAngle + endAngle) / 2;
                    const textRadius = radius * 0.65;
                    const textX = centerX + Math.cos(midAngle) * textRadius;
                    const textY = centerY + Math.sin(midAngle) * textRadius;
                    
                    ctx.save();
                    ctx.translate(textX, textY);
                    ctx.rotate(midAngle);
                    ctx.font = '9px Inter, sans-serif';
                    ctx.fillStyle = '#000000';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    // 截断过长的任务名称
                    const displayText = task.name.length > 8 ? task.name.substring(0, 8) + '...' : task.name;
                    ctx.fillText(displayText, 0, 0);
                    ctx.restore();
                }
            });
            
            // 更新总时长显示
            const hours = Math.floor(totalDuration);
            const minutes = Math.round((totalDuration - hours) * 60);
            const durationText = `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`;
            
            const durationElement = document.createElement('div');
            durationElement.className = 'text-center mt-2 text-sm font-medium text-gray-700';
            durationElement.textContent = `总工作时长: ${durationText}`;
            
            const canvasParent = canvas.parentElement;
            // 移除已有的时长显示
            const existingDuration = canvasParent.nextElementSibling;
            if (existingDuration && existingDuration.className.includes('font-medium')) {
                existingDuration.remove();
            }
            canvasParent.appendChild(durationElement);
            
            // 添加图例
            createHistoryLegend(categoryStats);
        }
        
        // 绘制日期中心文本
        const day = targetDate.getDate();
        const month = targetDate.getMonth() + 1;
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillStyle = '#3b82f6';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(day.toString(), centerX, centerY);
        
        ctx.font = '12px Inter, sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#6b7280';
        ctx.fillText(month + '月', centerX, centerY);
    }
    
    function createHistoryLegend(categoryStats) {
        const container = document.getElementById('history-container');
        if (!container) return;
        
        // 移除已有的图例
        const existingLegend = document.querySelector('.history-legend');
        if (existingLegend) {
            existingLegend.remove();
        }
        
        // 准备图例数据（按时间排序）
        const legendItems = Object.entries(categoryStats)
            .map(([category, duration]) => ({
                category,
                duration,
                color: getCategoryColor(category)
            }))
            .sort((a, b) => b.duration - a.duration);
        
        if (legendItems.length > 0) {
            const legendDiv = document.createElement('div');
            legendDiv.className = 'history-legend mt-4';
            legendDiv.innerHTML = '<h4 class="font-medium mb-2 text-sm">分类时间统计</h4>';
            
            const legendItemsDiv = document.createElement('div');
            legendItemsDiv.className = 'flex flex-wrap gap-2';
            
            legendItems.forEach(item => {
                const hours = Math.floor(item.duration);
                const minutes = Math.round((item.duration - hours) * 60);
                const durationText = minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'flex items-center bg-gray-50 px-2 py-1 rounded-md text-xs';
                itemDiv.innerHTML = `
                    <span class="inline-block w-3 h-3 rounded-full mr-1" style="background-color: ${item.color};"></span>
                    <span>${item.category}: ${durationText}</span>
                `;
                legendItemsDiv.appendChild(itemDiv);
            });
            
            legendDiv.appendChild(legendItemsDiv);
            
            // 找到时间图表容器并插入图例
            const chartContainer = document.querySelector('#history-container .mb-6');
            if (chartContainer) {
                chartContainer.appendChild(legendDiv);
            }
        }
    }
    
    function getCategoryColor(category) {
        const colorMap = {
            '工作': '#3b82f6',
            '学习': '#10b981',
            '生活': '#f59e0b',
            '健康': '#ef4444',
            '其他': '#8b5cf6'
        };
        return colorMap[category] || '#6b7280';
    }
    
    console.log('功能窗口初始化完成 - 适配新的弹窗结构');
}