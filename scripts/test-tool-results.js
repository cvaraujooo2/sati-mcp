// Teste específico para verificar se os tool results estão sendo processados corretamente

const testToolResultProcessing = async () => {
  console.log('🧪 Testando processamento de tool results...\n');

  const testRequest = {
    messages: [
      {
        id: "tool-result-test-001",
        role: "user", 
        content: "Delete o hiperfoco 'golfinhos' permanentemente com confirmação",
        timestamp: new Date().toISOString(),
        toolCalls: [],
        toolResults: []
      }
    ],
    model: "gpt-4o-mini",
    temperature: 0.7
  };

  try {
    console.log('📤 Enviando requisição...');
    
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
    
    let toolCalls = [];
    let toolResults = [];
    let textEvents = [];
    
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
            console.log('\n🏁 Stream finalizado\n');
            continue;
          }
          
          try {
            const event = JSON.parse(data);
            
            if (event.type === 'tool_call') {
              toolCalls.push({
                id: event.toolCall?.id,
                name: event.toolCall?.name,
                status: event.toolCall?.status
              });
              console.log(`🔧 Tool Call ${toolCalls.length}: ${event.toolCall?.name} (ID: ${event.toolCall?.id})`);
            } 
            else if (event.type === 'tool_result') {
              const resultInfo = {
                id: event.toolResult?.id,
                toolCallId: event.toolResult?.toolCallId,
                hasResult: !!event.toolResult?.result,
                hasError: !!event.toolResult?.error
              };
              toolResults.push(resultInfo);
              
              console.log(`✅ Tool Result ${toolResults.length}:`);
              console.log(`   ID: ${resultInfo.id}`);
              console.log(`   ToolCallId: ${resultInfo.toolCallId}`);
              console.log(`   Has Result: ${resultInfo.hasResult}`);
              console.log(`   Has Error: ${resultInfo.hasError}`);
              
              // Verificar se está undefined
              if (resultInfo.id?.includes('undefined') || resultInfo.toolCallId?.includes('undefined')) {
                console.log('🚨 PROBLEMA: IDs undefined detectados!');
              }
            }
            else if (event.type === 'text') {
              textEvents.push(event.content);
              process.stdout.write('.');
            }
            
          } catch (e) {
            // Ignorar erros de parse
          }
        }
      }
    }
    
    console.log(`\n📊 Resumo dos Eventos:`);
    console.log(`🔧 Tool Calls: ${toolCalls.length}`);
    console.log(`✅ Tool Results: ${toolResults.length}`);
    console.log(`📝 Texto: ${textEvents.length} fragmentos`);
    
    // Verificar correspondências
    console.log(`\n🔍 Verificação de Correspondências:`);
    for (let i = 0; i < Math.min(toolCalls.length, toolResults.length); i++) {
      const call = toolCalls[i];
      const result = toolResults[i];
      const match = call.id === result.toolCallId;
      
      console.log(`${i + 1}. Call ID: ${call.id} → Result ToolCallId: ${result.toolCallId} ${match ? '✅' : '❌'}`);
    }
    
    if (toolResults.every(r => !r.id.includes('undefined') && !r.toolCallId.includes('undefined'))) {
      console.log('\n🎉 ✅ SUCESSO: Nenhum ID undefined detectado!');
    } else {
      console.log('\n❌ FALHA: IDs undefined ainda presentes');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

// Executar teste
testToolResultProcessing();