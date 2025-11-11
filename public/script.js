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

  const closeMenu = (e) => {
    if (!attachMenu.contains(e.target) && e.target !== attachBtn) {
      attachMenu.classList.add('hidden');
      attachBtn.setAttribute('aria-expanded', 'false');
    }
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    attachMenu.classList.toggle('hidden');
    attachBtn.setAttribute('aria-expanded', String(!attachMenu.classList.contains('hidden')));
  };

  attachBtn.addEventListener('click', toggleMenu);
  document.addEventListener('click', closeMenu);
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

    const contentDiv = document.createElement('div');
    contentDiv.className = 'inline-content';

    if (type === 'image') {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
      };
      img.className = 'inline-thumbnail';
      contentDiv.appendChild(img);
    } else {
      const iconDiv = document.createElement('div');
      iconDiv.className = 'inline-icon';
      const icon = document.createElement('i');
      icon.className = type === 'audio'
        ? 'fa-solid fa-microphone'
        : 'fa-regular fa-file-lines';
      iconDiv.appendChild(icon);
      contentDiv.appendChild(iconDiv);
    }

    const infoDiv = document.createElement('div');
    infoDiv.className = 'inline-info';
    const name = document.createElement('span');
    name.className = 'inline-filename';
    name.textContent = file.name;
    infoDiv.appendChild(name);
    contentDiv.appendChild(infoDiv);

    wrapper.appendChild(contentDiv);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'inline-remove';
    removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    removeBtn.title = 'Remove attachment';
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      clearPreview();
    });

    wrapper.appendChild(removeBtn);
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

    const userGroup = document.createElement('div');
    userGroup.className = 'message-group user';
    chatBox.appendChild(userGroup);

    if (pendingFile) {
      addAttachmentBubble(userGroup, pendingFile, pendingType);
    }
    if (userMessage) {
      addMessage(userGroup, userMessage, 'user', false);
    }

    const botGroup = document.createElement('div');
    botGroup.className = 'message-group bot';
    chatBox.appendChild(botGroup);
    const thinking = addMessage(botGroup, 'Thinking...', 'bot', false);

    chatBox.scrollTop = chatBox.scrollHeight;

    const fileToSend = pendingFile;
    const typeToSend = pendingType;
    clearPreview();
    userInput.value = '';

    await sendToServer(userMessage, thinking, fileToSend, typeToSend);
  }

  async function sendToServer(userMessage, thinkingBubble, fileRef, fileType) {
    try {
      let response;

      if (fileRef) {
        const formData = new FormData();
        formData.append(fileType, fileRef);
        formData.append('prompt', userMessage || 'Analyze this file.');

        const endpoint = fileType === 'image'
          ? '/generate-from-image'
          : fileType === 'audio'
            ? '/generate-from-audio'
            : '/generate-from-document';

        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          body: formData
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation: [{ role: 'user', text: userMessage }]
          })
        });
      }

      const data = await response.json();
      thinkingBubble.innerHTML = data.result || 'No response';
      thinkingBubble.className = `message bot-message formatted`;
    } catch (err) {
      thinkingBubble.textContent = `Error: ${err.message || err}`;
    }
  }

  function addMessage(parent, content, sender, isHtml = false) {
    const div = document.createElement('div');
    div.className = `message ${sender}-message`;
    
    if (isHtml) {
      div.innerHTML = content;
      div.classList.add('formatted');
    } else {
      div.textContent = content;
    }
    
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
      img.onload = () => {
        URL.revokeObjectURL(img.src);
      };
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
