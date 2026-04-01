import os

api_dir = 'src/redux/api'
files = [f for f in os.listdir(api_dir) if f.endswith('.js')]

for f in files:
    path = os.path.join(api_dir, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if 'fetch(' in content:
        print(f"Updating {f}")
        # Add import if missing
        if 'from "../../utils/authFetch"' not in content:
            # Add after first line if first line is a comment, or at the top
            lines = content.split('\n')
            if lines[0].startswith('//'):
                lines.insert(1, 'import { authFetch } from "../../utils/authFetch";')
                content = '\n'.join(lines)
            else:
                content = 'import { authFetch } from "../../utils/authFetch";\n' + content
        
        # Replace fetch with authFetch
        content = content.replace('fetch(', 'authFetch(')
        
        with open(path, 'w', encoding='utf-8') as file:
            file.write(content)

print("Done.")
