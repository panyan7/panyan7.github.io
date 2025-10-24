#!/usr/bin/env python3

import os
import json
from datetime import datetime

def update_blog_list():
    """Update the blog-list.json file with all .md files in the posts directory"""
    posts_dir = 'posts'
    json_file = os.path.join('writings', 'blog-list.json')
    
    try:
        # Read all files in the posts directory
        files = [f for f in os.listdir(posts_dir) 
                if f.endswith('.md')]
        files.sort()  # Sort alphabetically
        
        # Create JSON object
        blog_list = {
            'files': files,
            'count': len(files),
            'generated': datetime.now().isoformat()
        }
        
        # Write JSON file
        with open(json_file, 'w') as f:
            json.dump(blog_list, f, indent=2)
        
        print(f"✅ Updated blog-list.json with {len(files)} blog files:")
        for file in files:
            print(f"   - {file}")
            
    except Exception as e:
        print(f"❌ Error updating blog list: {e}")
        exit(1)

if __name__ == '__main__':
    update_blog_list()
