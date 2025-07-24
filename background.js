let isEnabled = true;

console.log('[Form Backup Background] Script loaded');

browser.runtime.onInstalled.addListener(() => {
  console.log('[Form Backup Background] Extension installed/updated');
  browser.storage.local.set({ enabled: true });
  updateIcon(true);
});

browser.storage.local.get('enabled').then(result => {
  isEnabled = result.enabled !== false;
  console.log('[Form Backup Background] Initial enabled state:', isEnabled);
  updateIcon(isEnabled);
}).catch(error => {
  console.error('[Form Backup Background] Error getting enabled state:', error);
});

function updateIcon(enabled) {
  const path = enabled ? 'icons/icon-enabled-' : 'icons/icon-disabled-';
  console.log('[Form Backup Background] Updating icon, enabled:', enabled);
  browser.browserAction.setIcon({
    path: {
      '16': path + '16.png',
      '48': path + '48.png',
      '128': path + '128.png'
    }
  }).catch(error => {
    console.error('[Form Backup Background] Error updating icon:', error);
  });
}

function getDateString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  return `${month}-${day}-${year}`;
}

function getFileName() {
  return `${getDateString()}-form-data.txt`;
}

async function appendToFile(data) {
  const fileName = getFileName();
  const content = `${data.label}\n${data.value}\n\n`;
  console.log('[Form Backup Background] Appending to file:', fileName, 'Label:', data.label, 'Value length:', data.value.length);
  
  try {
    const existingFiles = await browser.storage.local.get(fileName);
    const currentContent = existingFiles[fileName] || '';
    const newContent = currentContent + content;
    
    await browser.storage.local.set({ [fileName]: newContent });
    
    const blob = new Blob([newContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const downloadId = await browser.downloads.download({
      url: url,
      filename: fileName,
      conflictAction: 'overwrite',
      saveAs: false
    });
    console.log('[Form Backup Background] File saved successfully, download ID:', downloadId);
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
  } catch (error) {
    console.error('[Form Backup Background] Error saving file:', error);
  }
}

browser.runtime.onMessage.addListener((message, sender) => {
  console.log('[Form Backup Background] Received message:', message.type, 'from:', sender.tab?.id || 'popup');
  
  if (message.type === 'capture-data' && isEnabled) {
    console.log('[Form Backup Background] Processing capture-data');
    appendToFile(message.data);
  } else if (message.type === 'toggle-enabled') {
    isEnabled = message.enabled;
    console.log('[Form Backup Background] Toggling enabled state to:', isEnabled);
    browser.storage.local.set({ enabled: isEnabled }).catch(error => {
      console.error('[Form Backup Background] Error saving enabled state:', error);
    });
    updateIcon(isEnabled);
    
    browser.tabs.query({}).then(tabs => {
      console.log('[Form Backup Background] Broadcasting toggle-state to', tabs.length, 'tabs');
      tabs.forEach(tab => {
        browser.tabs.sendMessage(tab.id, {
          type: 'toggle-state',
          enabled: isEnabled
        }).catch((error) => {
          console.log('[Form Backup Background] Could not send to tab', tab.id, '- probably no content script');
        });
      });
    }).catch(error => {
      console.error('[Form Backup Background] Error querying tabs:', error);
    });
  } else if (message.type === 'get-state') {
    console.log('[Form Backup Background] Returning state:', isEnabled);
    return Promise.resolve({ enabled: isEnabled });
  }
});