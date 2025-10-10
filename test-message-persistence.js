// Teste específico para verificar se as mensagens aparecem após tool calls
const testMessagePersistence = async () => {
  console.log('🧪 Testando persistência de mensagens após tool calls...\n');

  const testRequest = {
    messages: [
      {
        id: "persistence-test-001",
        role: "user", 
        content: "Crie um hiperfoco para estudar Node.js e depois quebre em subtarefas",
        timestamp: new Date().toISOString(),
        toolCalls: [],
        toolResults: []
      }
    ],
    model: "gpt-4o-mini",
    temperature: 0.7
  };

  try {
    console.log('📤 Enviando requisição com comando complexo...');
    
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testRequest)
    });

    if (!response.ok) {
      console.error('❌ Erro na requisição:', response.status);
      return;
    }

    console.log('✅ Processando stream...\n');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    let toolCallCount = 0;
    let toolResultCount = 0;
    let textEventCount = 0;
    let accumulatedText = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          
          if (data === '[DONE]') {
            console.log('\n🏁 Stream finalizado');
            continue;
          }
          
          try {
            const event = JSON.parse(data);
            
            if (event.type === 'text') {
              textEventCount++;
              accumulatedText += event.content || '';
              if (textEventCount % 10 === 0 || event.content?.includes('.')) {
                process.stdout.write('.');
              }
            } else if (event.type === 'tool_call') {
              toolCallCount++;
              console.log(`\n🔧 Tool Call ${toolCallCount}: ${event.toolCall?.name || 'unknown'}`);
            } else if (event.type === 'tool_result') {
              toolResultCount++;
              console.log(`✅ Tool Result ${toolResultCount}`);
            } else if (event.type === 'conversation_saved') {
              console.log(`\n💾 Conversa salva: ${event.conversationId}`);
            }
            
          } catch (e) {
            // Ignorar erros de parse
          }
        }
      }
    }
    
    console.log(`\n\n📊 Resumo:`);
    console.log(`🔧 Tool Calls: ${toolCallCount}`);
    console.log(`✅ Tool Results: ${toolResultCount}`);
    console.log(`📝 Eventos de Texto: ${textEventCount}`);
    console.log(`📄 Texto Final (${accumulatedText.length} chars):`);
    console.log(`"${accumulatedText.substring(0, 200)}..."`);
    
    if (accumulatedText.length > 0) {
      console.log('\n🎉 ✅ SUCESSO: Mensagem persistiu após tool calls!');
    } else {
      console.log('\n❌ FALHA: Nenhum texto foi retornado');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

// Executar teste
testMessagePersistence();