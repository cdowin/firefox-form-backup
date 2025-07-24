# Firefox Form Backup Extension

A simple Firefox-only WebExtension that automatically captures text input from web forms and saves it to daily text files in your Downloads folder for backup/recovery purposes.

## Features

- Captures text from `<input type="text">` fields within forms
- Automatically excludes sensitive fields (passwords, credit cards, SSN, etc.)
- Saves to daily files with format: `MM-DD-YYYY-form-data.txt` in your Downloads folder
- Simple on/off toggle via browser toolbar
- Debounced capture (waits 500ms after typing stops)

## Installation

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on"
4. Navigate to this project folder and select `manifest.json`
5. The extension icon will appear in your toolbar


## Usage

1. Click the extension icon in the toolbar to toggle capture on/off
2. When enabled (green icon), the extension will capture text from form fields as you type
3. Text is saved to daily files in your Downloads folder

## File Format

Files are saved with the following format:
```
FORM LABEL
Your typed text here

ANOTHER FORM LABEL
More text content

```

## Privacy & Security

- The extension automatically excludes sensitive fields containing keywords like:
  - password, passwd, pwd
  - ssn, social-security
  - credit-card, creditcard, cc-number
  - cvv, cvc, security-code
  - bank-account, account-number
  - routing-number
  - pin, secret, token

## Limitations

- Only captures `<input type="text">` fields within `<form>` elements
- Does not capture textarea elements or rich text editors
- Files can only be saved to the Downloads folder (Firefox WebExtension limitation)
- Firefox-only extension using Firefox's downloads API
- As a temporary extension, it will be removed when Firefox restarts

## Development

To make permanent changes:
1. Modify the source files
2. Reload the extension in `about:debugging`

## Debugging

The extension includes comprehensive console logging. To view logs:
1. Open Firefox Developer Tools (F12)
2. Go to the Console tab
3. Filter for "[Form Backup]" to see all extension logs

Log prefixes:
- `[Form Backup]` - Content script logs (form detection, input events)
- `[Form Backup Background]` - Background script logs (file saving, state management)
- `[Form Backup Popup]` - Popup script logs (UI interactions)

## Troubleshooting

**Background script shows as "Stopped"**: This is normal - the extension uses a persistent background script that stays active.

**Intermittent capture issues**: Check the console logs to see if:
- Input events are being detected
- Debounce timers are firing
- Data is being sent to the background script
- Files are being saved successfully

To create a permanent installation:
1. Get a Firefox Developer account
2. Sign the extension at https://addons.mozilla.org
3. Install the signed .xpi file