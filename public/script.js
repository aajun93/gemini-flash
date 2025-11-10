document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'http://localhost:3000';
  const chatBox = document.getElementById('chat-box');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const attachBtn = document.getElementById('attach-btn');
  const attachMenu = document.getElementById('attach-menu');
  const attachmentPreview = document.getElementById('attachment-preview');
  const imageInput = document.getElementById('image-input');
  const docInput = document.getElementById('doc-input');
  const audioInput = document.getElementById('audio-input');

  let pendingFile = null;
  let pendingType = null;

  // Toggle attachment menu
  attachBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    attachMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!attachMenu.contains(e.target) && e.target !== attachBtn) {
      attachMenu.classList.add('hidden');
    }
  });

  // File input handlers
  imageInput.addEventListener('change', (e) => handleFileSelect(e, 'image'));
  docInput.addEventListener('change', (e) => handleFileSelect(e, 'document'));
  audioInput.addEventListener('change', (e) => handleFileSelect(e, 'audio'));

  function handleFileSelect(e, type) {
    const file = e.target.files[0];
    if (!file) return;
    attachMenu.classList.add('hidden');
    pendingFile = file;
    pendingType = type;
    showPreview(file, type);
  }

  function showPreview(file, type) {
    attachmentPreview.innerHTML = '';
    const item = document.createElement('div');
    item.className = 'preview-item';

    let icon = document.createElement('i');
    if (type === 'image') icon.className = 'fa-regular fa-image';
    else if (type === 'audio') icon.className = 'fa-solid fa-microphone';
    else icon.className = 'fa-regular fa-file-lines';

    const name = document.createElement('span');
    name.textContent = file.name;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-preview';
    removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    removeBtn.onclick = () => clearPreview();

    item.append(icon, name, removeBtn);
    attachmentPreview.appendChild(item);
  }

  function clearPreview() {
    attachmentPreview.innerHTML = '';
    pendingFile = null;
    pendingType = null;
    imageInput.value = '';
    docInput.value = '';
    audioInput.value = '';
  }

  chatForm.addEventListener('submit', handleSend);
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  });

  async function handleSend(e) {
    e.preventDefault();
    const userMessage = userInput.value.trim();
    if (!userMessage && !pendingFile) return;

    if (pendingFile) {
      addAttachmentBubble(pendingFile, pendingType, 'user');
      addMessage(userMessage, 'user');
      const thinking = addMessage('Thinking...', 'bot');
      await sendFileWithPrompt(pendingFile, pendingType, userMessage, thinking);
      clearPreview();
    } else {
      addMessage(userMessage, 'user');
      const thinking = addMessage('Thinking...', 'bot');
      await sendText(userMessage, thinking);
    }

    userInput.value = '';
  }

  async function sendText(message, thinkingMsg) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation: [{ role: 'user', text: message }] }),
      });
      const data = await res.json();
      thinkingMsg.textContent = data.result || 'No response';
    } catch (err) {
      thinkingMsg.textContent = 'Error: ' + err.message;
    }
  }

  async function sendFileWithPrompt(file, type, prompt, thinkingMsg) {
    const formData = new FormData();
    formData.append(type, file);
    formData.append('prompt', prompt || 'Analyze this file.');

    const endpoint =
      type === 'image'
        ? '/generate-from-image'
        : type === 'audio'
        ? '/generate-from-audio'
        : '/generate-from-document';

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      thinkingMsg.textContent = data.result || 'No response';
    } catch (err) {
      thinkingMsg.textContent = 'Error: ' + err.message;
    }
  }

  function addMessage(content, sender) {
    const div = document.createElement('div');
    div.className = `message ${sender}-message`;
    div.textContent = content;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return div;
  }

  function addAttachmentBubble(file, type, sender) {
    const div = document.createElement('div');
    div.className = `attachment-bubble ${sender}`;
    if (type === 'image') {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      div.appendChild(img);
    } else {
      const iconDiv = document.createElement('div');
      iconDiv.className = 'file-icon';
      const icon = document.createElement('i');
      icon.className =
        type === 'audio'
          ? 'fa-solid fa-microphone'
          : 'fa-regular fa-file-lines';
      const label = document.createElement('span');
      label.textContent = file.name;
      iconDiv.append(icon, label);
      div.appendChild(iconDiv);
    }
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});
