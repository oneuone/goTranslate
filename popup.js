// popup.js - 弹出窗口脚本

// 获取DOM元素
const inputTextArea = document.getElementById('input-text');
const translateButton = document.getElementById('translate-button');
const resultDiv = document.getElementById('result');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 为翻译按钮添加点击事件
  translateButton.addEventListener('click', handleTranslate);
  
  // 为输入框添加快捷键事件（Ctrl+Enter 触发翻译）
  inputTextArea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleTranslate();
    }
  });
});

// 处理翻译
function handleTranslate() {
  const text = inputTextArea.value.trim();
  
  if (!text) {
    resultDiv.textContent = '请输入要翻译的文本';
    return;
  }
  
  // 显示加载状态
  resultDiv.textContent = '翻译中...';
  
  // 发送消息到后台脚本进行翻译
  chrome.runtime.sendMessage({
    action: 'translate',
    text: text,
    from: 'popup'
  }, response => {
    if (response && response.result) {
      // 显示翻译结果
      resultDiv.textContent = response.result;
      
      // 同时发送到侧边栏
      chrome.runtime.sendMessage({
        action: 'updateSidePanel',
        result: response.result,
        originalText: text
      });
    } else if (response && response.error) {
      resultDiv.textContent = `错误: ${response.error}`;
    }
  });
}