#!/usr/bin/env python3
"""
Script para adicionar 'const supabase = await createClient();' em TODAS as funções async que usam supabase
"""

import re
import os

tools_dir = "/home/ester/Documentos/sati-mcp/src/lib/mcp/tools"

# Procurar todos os arquivos .ts
for filename in os.listdir(tools_dir):
    if not filename.endswith('.ts') or filename == 'index.ts':
        continue
        
    filepath = os.path.join(tools_dir, filename)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Procurar todas as funções async que usam 'await supabase'
    # E adicionar 'const supabase = await createClient()' se não existir
    
    # Pattern mais robusto: encontrar funções async e adicionar supabase client após o try {
    pattern = r"(async function [^{]+\{[^}]*?try \{)(?!\s*const supabase)"
    
    def add_supabase_if_needed(match):
        original = match.group(1)
        # Verificar se a função usa 'await supabase' em algum lugar depois
        return original + "\n    const supabase = await createClient();\n"
    
    # Primeiro pass: adicionar após 'try {' em funções que ainda não têm
    new_content = content
    
    # Encontrar todas as funções async que usam supabase mas não têm createClient
    async_functions = re.finditer(r'(async function \w+\([^)]+\)[^{]*\{)', content)
    
    for match in async_functions:
        func_start = match.start()
        func_text_start = match.group(1)
        
        # Procurar o próximo 'try {' após essa função
        try_match = re.search(r'try \{', content[func_start:])
        if try_match:
            try_pos = func_start + try_match.end()
            
            # Verificar se usa 'await supabase' nesta função
            # e se ainda não tem 'const supabase = await createClient'
            func_end = content.find('\n}\n', try_pos)
            if func_end == -1:
                func_end = len(content)
                
            func_body = content[try_pos:func_end]
            
            if 'await supabase' in func_body and 'const supabase = await createClient' not in func_body:
                # Adicionar o createClient
                new_content = (content[:try_pos] + 
                             "\n    const supabase = await createClient();\n" +
                             content[try_pos:])
                content = new_content
                print(f"✅ Adicionado createClient em função auxiliar de {filename}")
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ Arquivo atualizado: {filename}")

print("\n✅ Script concluído!")
