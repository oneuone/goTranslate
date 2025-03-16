// sidepanel.js - 侧边栏脚本

// 翻译历史记录容器
const translationHistoryContainer = document.getElementById('translation-history');

// 最大历史记录数量
const MAX_HISTORY_ITEMS = 50;

// 初始化时从存储中加载历史记录
document.addEventListener('DOMContentLoaded', () => {
  loadTranslationHistory();
});

// 监听来自后台脚本的消息
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'updateSidePanel') {
    // 添加新的翻译记录到侧边栏
    addTranslationToHistory(message.originalText, message.result);
  }
  return true;
});

// 从存储中加载翻译历史记录
function loadTranslationHistory() {
  chrome.storage.local.get(['translationHistory'], (result) => {
    const history = result.translationHistory || [];
    
    // 清空当前显示
    clearHistoryDisplay();
    
    if (history.length === 0) {
      // 显示空状态
      showEmptyState();
    } else {
      // 显示历史记录
      history.forEach(item => {
        createHistoryItemElement(item.original, item.translated, item.timestamp);
      });
    }
  });
}

// 添加新的翻译记录到历史
function addTranslationToHistory(originalText, translatedText) {
  // 创建新的历史记录项
  const timestamp = new Date().toLocaleString('zh-CN');
  
  // 从存储中获取现有历史记录
  chrome.storage.local.get(['translationHistory'], (result) => {
    let history = result.translationHistory || [];
    
    // 添加新记录到开头
    history.unshift({
      original: originalText,
      translated: translatedText,
      timestamp: timestamp
    });
    
    // 限制历史记录数量
    if (history.length > MAX_HISTORY_ITEMS) {
      history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    
    // 保存回存储
    chrome.storage.local.set({ translationHistory: history }, () => {
      // 更新显示
      clearHistoryDisplay();
      history.forEach(item => {
        createHistoryItemElement(item.original, item.translated, item.timestamp);
      });
    });
  });
}

// 清空历史记录显示
function clearHistoryDisplay() {
  translationHistoryContainer.innerHTML = '';
}

// 显示空状态
function showEmptyState() {
  const emptyState = document.createElement('div');
  emptyState.className = 'empty-state';
  emptyState.innerHTML = '<p>在网页上选中文本并点击翻译按钮，翻译结果将显示在这里</p>';
  translationHistoryContainer.appendChild(emptyState);
}

// 创建历史记录项元素
function createHistoryItemElement(originalText, translatedText, timestamp) {
  // 移除空状态（如果存在）
  const emptyState = translationHistoryContainer.querySelector('.empty-state');
  if (emptyState) {
    emptyState.remove();
  }
  
  // 创建历史记录项
  const historyItem = document.createElement('div');
  historyItem.className = 'translation-item';
  
  // 原文
  const originalElement = document.createElement('div');
  originalElement.className = 'original-text';
  originalElement.textContent = originalText;
  
  // 译文
  const translatedElement = document.createElement('div');
  translatedElement.className = 'translated-text';
  translatedElement.textContent = translatedText;
  
  // 时间戳
  const timestampElement = document.createElement('div');
  timestampElement.className = 'timestamp';
  timestampElement.textContent = timestamp;
  
  // 组装
  historyItem.appendChild(originalElement);
  historyItem.appendChild(translatedElement);
  historyItem.appendChild(timestampElement);
  
  // 添加到容器
  translationHistoryContainer.insertBefore(historyItem, translationHistoryContainer.firstChild);
}