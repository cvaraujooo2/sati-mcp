// Teste rápido da API de chat para verificar se o erro foi corrigido
const testChatAPI = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            id: 'test-1',
            role: 'user',
            content: 'Oi, pode me ajudar a criar um hiperfoco?',
            timestamp: new Date().toISOString()
          }
        ]
      })
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        console.log('Chunk:', chunk);
        
        // Se encontrarmos dados sem erro de schema, o problema foi corrigido
        if (chunk.includes('Invalid schema')) {
          console.log('❌ Problema ainda existe');
          return;
        }
        
        if (chunk.includes('[DONE]')) {
          console.log('✅ API funcionando corretamente!');
          return;
        }
      }
    } else {
      console.log('Erro:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
};

testChatAPI();