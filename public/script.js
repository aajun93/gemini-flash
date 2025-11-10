document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'http://localhost:3000';
  const chatBox = document.getElementById('chat-box');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const attachBtn = document.getElementById('attach-btn');
  const attachMenu = document.getElementById('attach-menu');
  const inlinePreview = document.getElementById('inline-preview');
  const imageInput = document.getElementById('image-input');
  const docInput = document.getElementById('doc-input');
  const audioInput = document.getElementById('audio-input');

  let pendingFile = null;
  let pendingType = null;

  attachBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    attachMenu.classList.toggle('hidden');
    attachBtn.setAttribute('aria-expanded', String(!attachMenu.classList.contains('hidden')));
  });

  document.addEventListener('click', (e) => {
    if (!attachMenu.contains(e.target) && e.target !== attachBtn) {
      attachMenu.classList.add('hidden');
      attachBtn.setAttribute('aria-expanded', 'false');
    }
  });

  imageInput.addEventListener('change', (e) => handleFileSelect(e, 'image'));
  docInput.addEventListener('change', (e) => handleFileSelect(e, 'document'));
  audioInput.addEventListener('change', (e) => handleFileSelect(e, 'audio'));

  function handleFileSelect(e, type) {
    const file = e.target.files[0];
    if (!file) return;
    pendingFile = file;
    pendingType = type;
    attachMenu.classList.add('hidden');
    showInlinePreview(file, type);
  }

  function showInlinePreview(file, type) {
    inlinePreview.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'inline-item';

    if (type === 'image') {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => URL.revokeObjectURL(img.src);
      wrapper.appendChild(img);
    } else {
      const icon = document.createElement('i');
      icon.className = type === 'audio'
        ? 'fa-solid fa-microphone file-icon'
        : 'fa-regular fa-file-lines file-icon';
      wrapper.appendChild(icon);
    }

    const name = document.createElement('span');
    name.textContent = file.name;
    wrapper.appendChild(name);

    const remove = document.createElement('button');
    remove.className = 'remove-preview';
    remove.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    remove.title = 'Remove attachment';
    remove.onclick = () => clearPreview();

    wrapper.appendChild(remove);
    inlinePreview.appendChild(wrapper);
  }

  function clearPreview() {
    inlinePreview.innerHTML = '';
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

    const group = document.createElement('div');
    group.className = 'message-group user';
    chatBox.appendChild(group);

    if (pendingFile) addAttachmentBubble(group, pendingFile, pendingType);
    if (userMessage) addMessage(group, userMessage, 'user');

    const botGroup = document.createElement('div');
    botGroup.className = 'message-group bot';
    chatBox.appendChild(botGroup);
    const thinking = addMessage(botGroup, 'Thinking...', 'bot');

    chatBox.scrollTop = chatBox.scrollHeight;

    const fileToSend = pendingFile;
    const typeToSend = pendingType;
    clearPreview();
    userInput.value = '';

    await sendToServer(userMessage, thinking, fileToSend, typeToSend);
  }

  async function sendToServer(userMessage, thinkingBubble, fileRef, fileType) {
    try {
      if (fileRef) {
        const formData = new FormData();
        formData.append(fileType, fileRef);
        formData.append('prompt', userMessage || 'Analyze this file.');

        const endpoint =
          fileType === 'image'
            ? '/generate-from-image'
            : fileType === 'audio'
            ? '/generate-from-audio'
            : '/generate-from-document';

        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        thinkingBubble.textContent = data.result || 'No response';
      } else {
        const res = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation: [{ role: 'user', text: userMessage }],
          }),
        });
        const data = await res.json();
        thinkingBubble.textContent = data.result || 'No response';
      }
    } catch (err) {
      thinkingBubble.textContent = 'Error: ' + (err.message || err);
    }
  }

  function addMessage(parent, content, sender) {
    const div = document.createElement('div');
    div.className = `message ${sender}-message`;
    div.textContent = content;
    parent.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return div;
  }

  function addAttachmentBubble(parent, file, type) {
    const bubble = document.createElement('div');
    bubble.className = 'attachment-bubble';

    if (type === 'image') {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => URL.revokeObjectURL(img.src);
      bubble.appendChild(img);
    } else {
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = file.name;
      bubble.appendChild(link);
    }

    parent.appendChild(bubble);
  }
});
