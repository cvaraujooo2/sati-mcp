// Teste para verificar as novas ferramentas de update e delete de hiperfocos

const testHyperfocusManagement = async () => {
  console.log('🧪 Testando gerenciamento completo de hiperfocos...\n');

  // Teste 1: Criar hiperfoco
  console.log('📝 Teste 1: Criar hiperfoco');
  const createRequest = {
    messages: [{
      id: "test-mgmt-001",
      role: "user", 
      content: "Crie um hiperfoco para estudar Rust",
      timestamp: new Date().toISOString(),
      toolCalls: [],
      toolResults: []
    }],
    model: "gpt-4o-mini",
    temperature: 0.7
  };

  let hyperfocusId = null;
  
  try {
    const createResponse = await sendRequest(createRequest);
    hyperfocusId = extractHyperfocusId(createResponse);
    console.log('✅ Hiperfoco criado com ID:', hyperfocusId);
  } catch (error) {
    console.error('❌ Erro ao criar hiperfoco:', error);
    return;
  }

  // Teste 2: Atualizar hiperfoco
  console.log('\n📝 Teste 2: Atualizar título do hiperfoco');
  const updateRequest = {
    messages: [
      ...createRequest.messages,
      {
        id: "test-mgmt-002",
        role: "assistant", 
        content: "Hiperfoco criado com sucesso!",
        timestamp: new Date().toISOString(),
        toolCalls: [],
        toolResults: []
      },
      {
        id: "test-mgmt-003",
        role: "user",
        content: "Mude o título para 'Rust Avançado' e a cor para verde",
        timestamp: new Date().toISOString(),
        toolCalls: [],
        toolResults: []
      }
    ],
    model: "gpt-4o-mini",
    temperature: 0.7
  };

  try {
    const updateResponse = await sendRequest(updateRequest);
    console.log('✅ Hiperfoco atualizado');
  } catch (error) {
    console.error('❌ Erro ao atualizar hiperfoco:', error);
  }

  // Teste 3: Arquivar hiperfoco
  console.log('\n📝 Teste 3: Arquivar hiperfoco');
  const archiveRequest = {
    messages: [
      ...updateRequest.messages,
      {
        id: "test-mgmt-004",
        role: "assistant",
        content: "Título e cor atualizados!",
        timestamp: new Date().toISOString(),
        toolCalls: [],
        toolResults: []
      },
      {
        id: "test-mgmt-005",
        role: "user",
        content: "Arquive esse hiperfoco por enquanto",
        timestamp: new Date().toISOString(),
        toolCalls: [],
        toolResults: []
      }
    ],
    model: "gpt-4o-mini",
    temperature: 0.7
  };

  try {
    const archiveResponse = await sendRequest(archiveRequest);
    console.log('✅ Hiperfoco arquivado');
  } catch (error) {
    console.error('❌ Erro ao arquivar hiperfoco:', error);
  }

  // Teste 4: Tentar deletar (deve pedir confirmação)
  console.log('\n📝 Teste 4: Tentar deletar hiperfoco');
  const deleteRequest = {
    messages: [
      ...archiveRequest.messages,
      {
        id: "test-mgmt-006",
        role: "assistant",
        content: "Hiperfoco arquivado!",
        timestamp: new Date().toISOString(),
        toolCalls: [],
        toolResults: []
      },
      {
        id: "test-mgmt-007",
        role: "user",
        content: "Delete esse hiperfoco permanentemente",
        timestamp: new Date().toISOString(),
        toolCalls: [],
        toolResults: []
      }
    ],
    model: "gpt-4o-mini",
    temperature: 0.7
  };

  try {
    const deleteResponse = await sendRequest(deleteRequest);
    console.log('✅ Deleção processada (deve ter pedido confirmação)');
  } catch (error) {
    console.error('❌ Erro ao processar deleção:', error);
  }

  console.log('\n🎯 Teste completo finalizado!');
};

async function sendRequest(requestBody) {
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
}

function extractHyperfocusId(events) {
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
testHyperfocusManagement();