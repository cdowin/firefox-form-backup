let isEnabled = true;
let captureTimers = new Map();

const DEBOUNCE_DELAY = 500;

console.log('[Form Backup] Content script loaded on:', window.location.href);

const SENSITIVE_PATTERNS = [
  'password', 'passwd', 'pwd',
  'ssn', 'social-security', 'social_security',
  'credit-card', 'credit_card', 'creditcard', 'cc-number', 'ccnum',
  'cvv', 'cvc', 'security-code', 'security_code',
  'bank-account', 'bank_account', 'account-number', 'account_number',
  'routing-number', 'routing_number',
  'pin', 'secret', 'token'
];

browser.runtime.onMessage.addListener((message) => {
  console.log('[Form Backup] Received message:', message);
  if (message.type === 'toggle-state') {
    isEnabled = message.enabled;
    console.log('[Form Backup] Extension enabled state changed to:', isEnabled);
  }
});

browser.storage.local.get('enabled').then(result => {
  isEnabled = result.enabled !== false;
  console.log('[Form Backup] Initial enabled state from storage:', isEnabled);
}).catch(error => {
  console.error('[Form Backup] Error getting enabled state:', error);
});

function isSensitiveField(input) {
  const type = input.type?.toLowerCase();
  if (type !== 'text') return true;
  
  const name = input.name?.toLowerCase() || '';
  const id = input.id?.toLowerCase() || '';
  const autocomplete = input.autocomplete?.toLowerCase() || '';
  const placeholder = input.placeholder?.toLowerCase() || '';
  
  const fieldText = `${name} ${id} ${autocomplete} ${placeholder}`;
  
  return SENSITIVE_PATTERNS.some(pattern => fieldText.includes(pattern));
}

function getFieldLabel(input) {
  if (input.labels && input.labels.length > 0) {
    return input.labels[0].textContent.trim();
  }
  
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) {
      return label.textContent.trim();
    }
  }
  
  const parent = input.closest('label');
  if (parent) {
    return parent.textContent.trim();
  }
  
  const placeholder = input.placeholder?.trim();
  if (placeholder) {
    return placeholder;
  }
  
  return 'Unknown Field';
}

function handleInput(event) {
  const input = event.target;
  const fieldInfo = `${input.tagName}[type=${input.type}][name=${input.name}][id=${input.id}]`;
  console.log('[Form Backup] Input event on:', fieldInfo, 'Value length:', input.value.length);
  
  if (!isEnabled) {
    console.log('[Form Backup] Capture disabled, ignoring input');
    return;
  }
  
  if (isSensitiveField(input)) {
    console.log('[Form Backup] Sensitive field detected, ignoring:', fieldInfo);
    return;
  }
  
  if (captureTimers.has(input)) {
    const existingTimer = captureTimers.get(input);
    clearTimeout(existingTimer);
    console.log('[Form Backup] Cleared existing timer for:', fieldInfo);
  }
  
  const timer = setTimeout(() => {
    console.log('[Form Backup] Debounce timer fired for:', fieldInfo);
    const label = getFieldLabel(input);
    const value = input.value;
    
    if (value.trim()) {
      console.log('[Form Backup] Sending data to background:', { label, valueLength: value.length });
      browser.runtime.sendMessage({
        type: 'capture-data',
        data: {
          label: label,
          value: value,
          timestamp: new Date().toISOString()
        }
      }).then(() => {
        console.log('[Form Backup] Data sent successfully');
      }).catch(error => {
        console.error('[Form Backup] Error sending data to background:', error);
      });
    } else {
      console.log('[Form Backup] Empty value, not sending');
    }
    
    captureTimers.delete(input);
  }, DEBOUNCE_DELAY);
  
  captureTimers.set(input, timer);
  console.log('[Form Backup] Set new debounce timer for:', fieldInfo);
}

function observeForms() {
  const inputs = document.querySelectorAll('form input[type="text"]');
  console.log('[Form Backup] Found', inputs.length, 'text inputs in forms');
  
  inputs.forEach(input => {
    if (!input.hasAttribute('data-form-backup-monitored')) {
      input.addEventListener('input', handleInput);
      input.setAttribute('data-form-backup-monitored', 'true');
      const fieldInfo = `${input.tagName}[type=${input.type}][name=${input.name}][id=${input.id}]`;
      console.log('[Form Backup] Monitoring input:', fieldInfo);
    }
  });
}

observeForms();

const observer = new MutationObserver((mutations) => {
  console.log('[Form Backup] DOM mutation detected, re-observing forms');
  observeForms();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});