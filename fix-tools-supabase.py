#!/usr/bin/env python3
"""
Script para adicionar 'const supabase = await createClient();' em todos os handlers das tools
"""

import re
import os

tools_dir = "/home/ester/Documentos/sati-mcp/src/lib/mcp/tools"

# Arquivos que precisam ser corrigidos
files_to_fix = [
    "startFocusTimer.ts",
    "breakIntoSubtasks.ts",
    "endFocusTimer.ts", 
    "deleteHyperfocus.ts",
    "createAlternancy.ts",
    "updateTaskStatus.ts",
    "analyzeContext.ts",
    "updateHyperfocus.ts"
]

for filename in files_to_fix:
    filepath = os.path.join(tools_dir, filename)
    
    if not os.path.exists(filepath):
        print(f"⚠️  Arquivo não encontrado: {filename}")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Procurar por 'export async function NOME Handler' e adicionar o supabase client
    # Pattern: encontrar o handler e adicionar logo após o 'try {'
    pattern = r"(export async function \w+Handler.*?\n.*?try \{)"
    
    def add_supabase_client(match):
        original = match.group(1)
        # Verificar se já não tem o createClient
        if 'createClient' in original or 'const supabase' in original:
            return original
        return original + "\n    const supabase = await createClient();\n"
    
    new_content = re.sub(pattern, add_supabase_client, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ Corrigido: {filename}")
    else:
        print(f"ℹ️  Sem mudanças: {filename}")

print("\n✅ Script concluído!")
