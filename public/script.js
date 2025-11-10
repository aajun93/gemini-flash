/**
 * Wait for the DOM to be fully loaded before attaching event listeners.
 */
document.addEventListener('DOMContentLoaded', () => {

    // PENTING: Target server Express yang berjalan di port 3000.
    const API_BASE_URL = 'http://localhost:3000';
    
    // Inisialisasi array untuk menyimpan seluruh riwayat percakapan.
    const conversationHistory = [];

    // Get references to the essential HTML elements
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');

    /**
     * Handles the chat form submission.
     */
    chatForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const userMessage = userInput.value.trim();
        if (!userMessage) return;

        // 1. Tambahkan pesan pengguna ke riwayat dan UI
        conversationHistory.push({ role: 'user', text: userMessage });
        addMessageToChatBox(userMessage, 'user');
        userInput.value = '';

        // 2. Tampilkan pesan "Thinking..." (hanya di UI)
        const thinkingMessageElement = addMessageToChatBox('Thinking...', 'bot');
        thinkingMessageElement.classList.add('animate-pulse');

        try {
            // 3. Kirim SELURUH riwayat percakapan untuk konteks
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversation: conversationHistory
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData ? errorData.message : `Server error! Status: ${response.status}`;
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (data && data.result) {
                const botResponseText = data.result;
                
                // 4. Perbarui UI dengan jawaban final dan hapus loading
                thinkingMessageElement.textContent = botResponseText;
                thinkingMessageElement.classList.remove('animate-pulse');

                // 4b. Tambahkan jawaban bot ke riwayat percakapan
                conversationHistory.push({ role: 'model', text: botResponseText });
                
            } else {
                thinkingMessageElement.textContent = 'Sorry, no response received.';
                // Jika respons gagal, hapus pesan pengguna terakhir dari riwayat
                conversationHistory.pop(); 
            }

        } catch (error) {
            // 5. Tangani kesalahan
            console.error('Error fetching chat response:', error);
            thinkingMessageElement.textContent = `Failed to get response: ${error.message}`;
            // Hapus pesan pengguna terakhir dari riwayat jika ada error
            conversationHistory.pop(); 
        }
    });

    /**
     * Helper function to create and append a new message to the chat box.
     */
    function addMessageToChatBox(content, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.textContent = content;
        chatBox.appendChild(messageElement);
        scrollToBottom(chatBox);
        return messageElement;
    }

    /**
     * Helper function to scroll an element to its bottom.
     */
    function scrollToBottom(element) {
        element.scrollTop = element.scrollHeight;
    }
});