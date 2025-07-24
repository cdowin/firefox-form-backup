const toggleCheckbox = document.getElementById('toggle-enabled');
const statusText = document.getElementById('status-text');

console.log('[Form Backup Popup] Popup opened, requesting state');

browser.runtime.sendMessage({ type: 'get-state' }).then(response => {
  console.log('[Form Backup Popup] Received state:', response);
  toggleCheckbox.checked = response.enabled;
  updateStatusText(response.enabled);
}).catch(error => {
  console.error('[Form Backup Popup] Error getting state:', error);
});

toggleCheckbox.addEventListener('change', () => {
  const enabled = toggleCheckbox.checked;
  console.log('[Form Backup Popup] Toggle changed to:', enabled);
  
  browser.runtime.sendMessage({
    type: 'toggle-enabled',
    enabled: enabled
  }).then(() => {
    console.log('[Form Backup Popup] Toggle message sent successfully');
  }).catch(error => {
    console.error('[Form Backup Popup] Error sending toggle message:', error);
  });
  
  updateStatusText(enabled);
});

function updateStatusText(enabled) {
  statusText.textContent = enabled ? 'Enabled' : 'Disabled';
  statusText.classList.toggle('disabled', !enabled);
  console.log('[Form Backup Popup] Updated status text to:', statusText.textContent);
}