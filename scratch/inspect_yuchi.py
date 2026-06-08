import sys
import re

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open('c:\\Claude\\연라이프\\어린이의_결_유치_월간\\index.html', 'r', encoding='utf-8') as f:
    content = f.read()
    
print("File length:", len(content))
print("First 500 characters:")
print(content[:500])

style_tags = re.findall(r'<style.*?>.*?</style>', content, re.DOTALL)
print("Found style tags:", len(style_tags))
link_tags = re.findall(r'<link.*?>', content)
print("Found link tags:", link_tags)
