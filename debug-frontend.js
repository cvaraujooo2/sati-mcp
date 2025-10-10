// Debug das mensagens no frontend
// Este script vai inspecionar o estado das mensagens no console do navegador

console.log('🔍 Iniciando debug do frontend...');

// Interceptar chamadas para setState nas mensagens
const originalLog = console.log;
console.log = function(...args) {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('[SSE Event]')) {
    originalLog('🎯 SSE Event intercepted:', args);
  }
  originalLog.apply(console, args);
};

// Observar mudanças no DOM
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          // Procurar por mensagens do assistente
          if (element.querySelector && element.querySelector('[role="assistant"]') || 
              element.textContent?.includes('SATI')) {
            console.log('📨 Nova mensagem do assistente detectada:', element);
            console.log('📝 Conteúdo:', element.textContent?.substring(0, 100));
          }
        }
      });
    }
  });
});

// Observar mudanças no container de mensagens
const messagesContainer = document.querySelector('[class*="messages"]') || document.body;
observer.observe(messagesContainer, {
  childList: true,
  subtree: true,
  attributes: false,
  attributeOldValue: false,
  characterData: false,
  characterDataOldValue: false
});

console.log('👀 Observador de DOM ativo. Aguardando mensagens...');

// Função para analisar estado atual das mensagens
function analyzeCurrentMessages() {
  const messages = document.querySelectorAll('[class*="message"], [class*="Message"]');
  console.log('📊 Análise das mensagens atuais:');
  console.log('📈 Total de mensagens:', messages.length);
  
  messages.forEach((msg, index) => {
    const role = msg.textContent?.includes('Você') ? 'user' : 
                 msg.textContent?.includes('SATI') ? 'assistant' : 'unknown';
    const content = msg.textContent?.substring(0, 50) + '...';
    
    console.log(`${index + 1}. [${role}] ${content}`);
  });
}

// Executar análise inicial após um delay
setTimeout(analyzeCurrentMessages, 1000);

// Também executar a cada 5 segundos
setInterval(analyzeCurrentMessages, 5000);

console.log('✅ Debug script ativo. Use analyzeCurrentMessages() para análise manual.');