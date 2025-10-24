# Blog System

This folder contains markdown files for blog posts. The blog system automatically generates the blog list and renders the content.

## Adding a New Blog

1. Create a new `.md` file in this folder
2. Add the file to the `blogFiles` array in `../blog-system.js`
3. Use the following frontmatter format:

```markdown
---
title: "Your Blog Title"
date: "YYYY-MM-DD"
excerpt: "A short description of your blog post."
---

# Your Blog Title

Your blog content here...

## Section Header

More content...
```

## Frontmatter Fields

- `title`: The blog post title
- `date`: Publication date in YYYY-MM-DD format
- `excerpt`: Short description shown in the blog list

## Markdown Support

The system supports basic markdown:
- Headers: `#`, `##`, `###`
- Paragraphs: Automatic
- Links: `[text](url)`
- Bold: `**text**`
- Italic: `*text*`

## Automatic Features

- Blogs are automatically sorted by date (newest first)
- Blog list is generated automatically
- Content is rendered from markdown to HTML
- Navigation between blog list and individual posts
