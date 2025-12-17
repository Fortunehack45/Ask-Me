export const timeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y";
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo";
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m";
  
  return "just now";
};

export const getDeviceId = (): string => {
  const key = 'cb_device_id';
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = 'anon_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(key, deviceId);
  }
  return deviceId;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!text) return false;

  // 1. Try Modern Async Clipboard API
  // This requires a secure context (HTTPS or localhost) and user interaction.
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("Clipboard API failed, trying fallback...", err);
    }
  }

  // 2. Fallback: execCommand('copy')
  // Proven to work on older iOS and Android WebViews where Clipboard API might be restricted.
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Ensure element is not visible but part of DOM to be selectable
    // Using opacity 0 and pointer-events none allows it to be 'visible' to the browser selection engine
    // while hidden from the user. 'display: none' or 'visibility: hidden' would prevent selection.
    textArea.style.position = "fixed";
    textArea.style.left = "0";
    textArea.style.top = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    textArea.style.opacity = "0";
    textArea.style.pointerEvents = "none";
    textArea.setAttribute('readonly', '');
    
    document.body.appendChild(textArea);
    
    // Select the text
    textArea.focus();
    textArea.select();
    
    // Extra step for iOS
    const range = document.createRange();
    range.selectNodeContents(textArea);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    textArea.setSelectionRange(0, 999999); // For mobile devices

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Fallback copy failed", err);
    return false;
  }
};