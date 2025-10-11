// Debug script para verificar o status das tool calls
console.log('=== DEBUG TOOL CALL STATUS ===');

// Simular uma tool call como recebida do SSE
const sampleToolCall = {
  id: "1",
  name: "listHyperfocus", 
  parameters: {},
  timestamp: new Date(),
  status: "executing"  // Status inicial
};

console.log('1. Tool Call inicial (executing):');
console.log(JSON.stringify(sampleToolCall, null, 2));

// Simular update para completed
const updatedToolCall = {
  ...sampleToolCall,
  status: "completed"
};

console.log('\n2. Tool Call após result (completed):');
console.log(JSON.stringify(updatedToolCall, null, 2));

// Verificar como o componente interpretaria isso
const getStatusIcon = (status) => {
  switch (status) {
    case "completed":
      return "✅ CheckCircle (green)";
    case "error":
      return "❌ XCircle (red)";  
    case "executing":
    case "pending":
      return "🕐 Clock (yellow, pulsing)";
    default:
      return "⚪ Clock (gray)";
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "completed":
      return "green background";
    case "error":
      return "red background";
    case "executing":
    case "pending":
      return "yellow background (problema aqui!)";
    default:
      return "gray background";
  }
};

console.log('\n3. Como seria renderizado:');
console.log('Status "executing":', getStatusIcon("executing"), '-', getStatusColor("executing"));
console.log('Status "completed":', getStatusIcon("completed"), '-', getStatusColor("completed"));

console.log('\n=== FIM DEBUG ===');
