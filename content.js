// content.js - 在网页中运行的内容脚本

// 创建浮动按钮元素
let floatingButton = null;

// 创建翻译结果显示元素
let translationPopup = null;

// 当前选中的文本
let selectedText = "";

// 监听鼠标选中事件
document.addEventListener('mouseup', function(e) {
  // 获取选中的文本
  const selection = window.getSelection();
  selectedText = selection.toString().trim();
  
  // 如果有选中文本，显示浮动按钮
  if (selectedText) {
    showFloatingButton(e.clientX, e.clientY);
  } else {
    hideFloatingButton();
  }
});

// 点击页面其他地方时隐藏浮动按钮和翻译结果
document.addEventListener('mousedown', function(e) {
  // 检查点击是否在浮动按钮或翻译结果弹窗之外
  if (floatingButton && !floatingButton.contains(e.target) && 
      translationPopup && !translationPopup.contains(e.target)) {
    hideFloatingButton();
    hideTranslationPopup();
  }
});

// 显示浮动按钮
function showFloatingButton(x, y) {
  // 如果按钮不存在，创建它
  if (!floatingButton) {
    floatingButton = document.createElement('div');
    floatingButton.className = 'go-translate-floating-button';
    floatingButton.innerHTML = '翻译';
    floatingButton.addEventListener('click', handleTranslateButtonClick);
    document.body.appendChild(floatingButton);
  }
  
  // 设置按钮位置，确保在视口内
  const buttonWidth = 60;
  const buttonHeight = 30;
  
  // 确保按钮不超出视口右边界
  if (x + buttonWidth > window.innerWidth) {
    x = window.innerWidth - buttonWidth - 10;
  }
  
  // 确保按钮不超出视口底部边界
  if (y + buttonHeight > window.innerHeight) {
    y = y - buttonHeight - 10;
  } else {
    y = y + 10; // 在选中文本下方显示
  }
  
  // 设置按钮样式和位置
  floatingButton.style.left = `${x}px`;
  floatingButton.style.top = `${y}px`;
  floatingButton.style.display = 'block';
}

// 隐藏浮动按钮
function hideFloatingButton() {
  if (floatingButton) {
    floatingButton.style.display = 'none';
  }
}

// 处理翻译按钮点击事件
function handleTranslateButtonClick() {
  if (selectedText) {
    // 显示加载中状态
    showTranslationPopup('加载中...');
    
    // 发送消息到后台脚本进行翻译
    chrome.runtime.sendMessage({
      action: 'translate',
      text: selectedText,
      from: 'content'
    }, response => {
      if (response && response.result) {
        // 显示翻译结果
        showTranslationPopup(response.result);
        
        // 同时发送到侧边栏
        chrome.runtime.sendMessage({
          action: 'updateSidePanel',
          result: response.result,
          originalText: selectedText
        });
      } else if (response && response.error) {
        showTranslationPopup(`错误: ${response.error}`);
      }
    });
  }
}

// 显示翻译结果弹窗
function showTranslationPopup(text) {
  // 如果弹窗不存在，创建它
  if (!translationPopup) {
    translationPopup = document.createElement('div');
    translationPopup.className = 'go-translate-popup';
    
    // 创建关闭按钮
    const closeButton = document.createElement('div');
    closeButton.className = 'go-translate-popup-close';
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', hideTranslationPopup);
    
    // 创建内容容器
    const contentDiv = document.createElement('div');
    contentDiv.className = 'go-translate-popup-content';
    
    // 创建侧边栏按钮
    const sidePanelButton = document.createElement('button');
    sidePanelButton.className = 'go-translate-sidepanel-button';
    sidePanelButton.innerHTML = '在侧边栏中查看';
    sidePanelButton.addEventListener('click', openSidePanel);
    
    // 添加到弹窗
    translationPopup.appendChild(closeButton);
    translationPopup.appendChild(contentDiv);
    translationPopup.appendChild(sidePanelButton);
    document.body.appendChild(translationPopup);
  }
  
  // 更新内容
  const contentDiv = translationPopup.querySelector('.go-translate-popup-content');
  contentDiv.textContent = text;
  
  // 设置弹窗位置（在浮动按钮附近）
  if (floatingButton) {
    const buttonRect = floatingButton.getBoundingClientRect();
    translationPopup.style.left = `${buttonRect.left}px`;
    translationPopup.style.top = `${buttonRect.bottom + 5}px`;
  }
  
  // 显示弹窗
  translationPopup.style.display = 'block';
}

// 隐藏翻译结果弹窗
function hideTranslationPopup() {
  if (translationPopup) {
    translationPopup.style.display = 'none';
  }
}

// 打开侧边栏
function openSidePanel() {
  chrome.runtime.sendMessage({ action: 'openSidePanel' });
}

// 监听来自后台脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showTranslation') {
    showTranslationPopup(message.result);
  }
  return true;
});