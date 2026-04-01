import os
import re

def get_relative_import(filepath, src_dir):
    # Calculate relative path from the directory of the file to src/utils
    file_dir = os.path.dirname(filepath)
    utils_dir = os.path.join(src_dir, 'utils')
    rel_path = os.path.relpath(utils_dir, file_dir)
    return rel_path.replace(os.sep, '/')

src_dir = 'src'

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if not (f.endswith('.js') or f.endswith('.jsx') or f.endswith('.ts') or f.endswith('.tsx')):
            continue
            
        path = os.path.join(root, f)
        
        # Skip utility files themselves and axiosClient
        if "authFetch" in path or "authAxios" in path or "axiosClient" in path:
            continue
            
        try:
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
        except Exception:
            continue
            
        original_content = content
        import_path = get_relative_import(path, src_dir)
        
        # 1. Handle fetch -> authFetch
        if 'fetch(' in content:
             import_str = f'import {{ authFetch }} from "{import_path}/authFetch";'
             # If it already was imported from earlier runs, we don't want to re-import
             if 'from "../../utils/authFetch"' in content or 'from "../utils/authFetch"' in content or 'from "./utils/authFetch"' in content or 'import { authFetch }' in content:
                 pass
             else:
                 content = import_str + '\n' + content
             content = re.sub(r'\bfetch\(', 'authFetch(', content)

        # 2. Handle axios -> authAxios / createAuthAxios
        if 'axios.create(' in content or 'axios.get(' in content or 'axios.post(' in content or 'axios.put(' in content or 'axios.patch(' in content or 'axios.delete(' in content:
             axios_import_str = f'import {{ authAxios, createAuthAxios }} from "{import_path}/authAxios";'
             
             needs_import = False
             if 'axios.create(' in content:
                 content = content.replace('axios.create(', 'createAuthAxios(')
                 needs_import = True
             if 'axios.get(' in content:
                 content = content.replace('axios.get(', 'authAxios.get(')
                 needs_import = True
             if 'axios.post(' in content:
                 content = content.replace('axios.post(', 'authAxios.post(')
                 needs_import = True
             if 'axios.put(' in content:
                 content = content.replace('axios.put(', 'authAxios.put(')
                 needs_import = True
             if 'axios.patch(' in content:
                 content = content.replace('axios.patch(', 'authAxios.patch(')
                 needs_import = True
             if 'axios.delete(' in content:
                 content = content.replace('axios.delete(', 'authAxios.delete(')
                 needs_import = True
                 
             if needs_import and 'import { authAxios' not in content:
                 content = axios_import_str + '\n' + content

        if content != original_content:
            print(f"Updating {path}")
            with open(path, 'w', encoding='utf-8') as file:
                file.write(content)

print("Global replacement done.")
