// Teste para verificar se o problema de UUID foi resolvido
// Simula uma conversa onde o usuário se refere a um hiperfoco por nome

const testUUIDFix = async () => {
  console.log('🧪 Testando correção de UUID...\n');

  // Simular primeira mensagem (criação)
  const firstRequest = {
    messages: [
      {
        id: "test-uuid-001",
        role: "user", 
        content: "Quero criar um hiperfoco para estudar Machine Learning",
        timestamp: new Date().toISOString(),
        toolCalls: [],
        toolResults: []
      }
    ],
    model: "gpt-4o-mini",
    temperature: 0.7
  };

  console.log('📤 1ª Mensagem: Criar hiperfoco ML');
  let response1 = await sendRequest(firstRequest);
  let hyperfocusId = await extractHyperfocusId(response1);
  console.log('✅ Hiperfoco criado com ID:', hyperfocusId);

  // Simular segunda mensagem (referência por nome)
  const secondRequest = {
    messages: [
      {
        id: "test-uuid-001",
        role: "user", 
        content: "Quero criar um hiperfoco para estudar Machine Learning",
        timestamp: new Date().toISOString(),
        toolCalls: [],
        toolResults: []
      },
      {
        id: "test-uuid-002", 
        role: "assistant",
        content: `Criei o hiperfoco 'Estudar Machine Learning' com sucesso! 

### Hiperfoco: Estudar Machine Learning
- **Descrição:** Focar em conceitos de machine learning...
- **Cor:** Azul
- **Tempo Estimado:** 120 minutos

Se precisar de ajuda para adicionar tarefas ou organizar melhor seu estudo, é só avisar!`,
        timestamp: new Date().toISOString(),
        toolCalls: [],
        toolResults: []
      },
      {
        id: "test-uuid-003",
        role: "user",
        content: "Agora quebra o hiperfoco 'Machine Learning' em subtarefas",
        timestamp: new Date().toISOString(),
        toolCalls: [],
        toolResults: []
      }
    ],
    model: "gpt-4o-mini", 
    temperature: 0.7
  };

  console.log('\n📤 2ª Mensagem: Quebrar em subtarefas (referência por nome)');
  let response2 = await sendRequest(secondRequest);
  console.log('✅ Resposta processada');

  console.log('\n🎯 Teste concluído!');
};

async function sendRequest(requestBody) {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let events = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const event = JSON.parse(line.substring(6));
            events.push(event);
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
    
    return events;
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return [];
  }
}

async function extractHyperfocusId(events) {
  for (const event of events) {
    if (event.type === 'tool_result' && event.toolResult?.result) {
      try {
        const result = typeof event.toolResult.result === 'string' 
          ? JSON.parse(event.toolResult.result)
          : event.toolResult.result;
        
        if (result.hyperfocusId) {
          return result.hyperfocusId;
        }
      } catch (e) {
        // Continue looking
      }
    }
  }
  return null;
}

// Executar teste
testUUIDFix();