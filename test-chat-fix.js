// Teste para verificar se o problema do chat foi resolvido
// Este script simula uma interação com o chat API

const testChatRequest = async () => {
  const requestBody = {
    messages: [
      {
        id: "test-001",
        role: "user", 
        content: "Quero criar um novo hiperfoco para estudar JavaScript avançado",
        timestamp: new Date().toISOString(),
        toolCalls: [],
        toolResults: []
      }
    ],
    model: "gpt-4o-mini",
    temperature: 0.7,
    systemPrompt: "Você é o SATI, um assistente especializado em produtividade para pessoas neurodivergentes."
  };

  try {
    console.log('🚀 Enviando requisição para o chat API...');
    
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('❌ Erro na requisição:', response.status, response.statusText);
      const errorData = await response.text();
      console.error('Detalhes do erro:', errorData);
      return;
    }

    console.log('✅ Resposta recebida, processando SSE stream...');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = '';
    let eventCount = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('🏁 Stream finalizado');
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          
          if (data === '[DONE]') {
            console.log('🔚 Recebido [DONE]');
            continue;
          }
          
          try {
            const event = JSON.parse(data);
            eventCount++;
            
            console.log(`📨 Evento ${eventCount}:`, event.type || 'unknown');
            
            if (event.type === 'text' && event.content) {
              process.stdout.write(event.content);
            } else if (event.type === 'tool_call') {
              console.log(`🔧 Tool Call: ${event.toolCall?.name}`);
            } else if (event.type === 'tool_result') {
              console.log(`✅ Tool Result para call ${event.toolResult?.toolCallId}`);
            } else if (event.type === 'conversation_saved') {
              console.log(`💾 Conversa salva: ${event.conversationId}`);
            }
            
          } catch (e) {
            console.error('❌ Erro ao parsear evento:', data);
          }
        }
      }
    }
    
    console.log(`\n\n📊 Total de eventos processados: ${eventCount}`);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

// Executar teste
testChatRequest();