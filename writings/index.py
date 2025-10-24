#!/usr/bin/env python3

import os
import json
from datetime import datetime

def list_blog_files():
    """List all .md files in the blogs directory"""
    blogs_dir = os.path.dirname(os.path.abspath(__file__))
    files = []
    
    try:
        # Scan the directory for .md files
        for item in os.listdir(blogs_dir):
            if item.endswith('.md'):
                files.append(item)
        
        # Sort files alphabetically
        files.sort()
        
        # Return JSON response
        response = {
            'files': files,
            'count': len(files),
            'generated': datetime.now().isoformat()
        }
        
        return response
    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    # Print JSON response for HTTP server
    import sys
    sys.stdout.write('Content-Type: application/json\n\n')
    result = list_blog_files()
    print(json.dumps(result))
