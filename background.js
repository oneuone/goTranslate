// background.js - 扩展的后台服务工作线程

// 初始化上下文菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translateSelection",
    title: "翻译选中文本",
    contexts: ["selection"]
  });
});

// 处理上下文菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translateSelection" && info.selectionText) {
    // 发送消息到内容脚本进行翻译
    chrome.tabs.sendMessage(tab.id, {
      action: "translate",
      text: info.selectionText
    });
  }
});

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openSidePanel") {
    // 打开侧边栏
    if (chrome.sidePanel) {
      chrome.sidePanel.open({ tabId: sender.tab.id });
    }
    return true;
  } else if (request.action === "translate") {
    // 调用翻译API
    translateText(request.text, request.sourceLanguage)
      .then(result => {
        // 将翻译结果发送回内容脚本或侧边栏
        if (request.from === "content") {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "showTranslation",
            result: result
          });
        } else if (request.from === "popup") {
          sendResponse({ result: result });
        } else {
          // 发送到侧边栏
          chrome.runtime.sendMessage({
            action: "updateSidePanel",
            result: result,
            originalText: request.text
          });
        }
      })
      .catch(error => {
        console.error("翻译出错:", error);
        sendResponse({ error: "翻译失败，请重试" });
      });
    
    return true; // 异步响应
  }
});

// 翻译函数
async function translateText(text, sourceLanguage) {
  try {
    // 自动检测语言（简单实现：包含中文字符则认为是中文，否则是英文）
    const isChinese = /[\u4e00-\u9fa5]/.test(text);
    
    // 构建请求消息
    const messages = [
      {
        "role": "system",
        "content": "你是一位精通多语言的翻译大师，能够准确地将用户输入的内容进行高质量翻译。中译英，英译中。"
      },
      {
        "role": "user",
        "content": text
      }
    ];
    
    // 调用腾讯云API
    const response = await fetch("https://api.lkeap.cloud.tencent.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "sk-RmJGfiNDJ19dSrkP7T1SKZm8cZ0LZSuez7E7c0lbXaAOETwh"
      },
      body: JSON.stringify({
        "model": "deepseek-r1",
        "messages": messages,
        "stream": true
      })
    });
    
    // 处理流式响应
    const reader = response.body.getReader();
    let translatedText = "";
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // 将二进制数据转换为文本
      const chunk = new TextDecoder().decode(value);
      
      // 处理数据块（格式：data: {JSON数据}\n\n）
      const lines = chunk.split("\n\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const jsonStr = line.substring(6); // 去掉 "data: "
            if (jsonStr.trim() === "[DONE]") continue;
            
            const data = JSON.parse(jsonStr);
            if (data.choices && data.choices[0].delta && data.choices[0].delta.reasoning_content) {
              translatedText += data.choices[0].delta.reasoning_content;
            }
          } catch (e) {
            console.error("解析JSON出错:", e, line);
          }
        }
      }
    }
    
    return translatedText.trim();
  } catch (error) {
    console.error("翻译API调用失败:", error);
    throw error;
  }
}