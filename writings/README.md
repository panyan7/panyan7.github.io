# Blog System

This folder contains markdown files for blog posts. The blog system automatically generates the blog list and renders the content.

## Adding a New Blog

1. Create a new `.md` file in the `../posts/` folder
2. Run `python3 ../update-blog-list.py` to update the blog list
3. Refresh your website - the new blog will appear automatically
4. Use the following frontmatter format:

```markdown
---
title: "Your Blog Title"
date: "YYYY-MM-DD"
language: "en"
---

# Your Blog Title

Your blog content here...

## Section Header

More content...
```

## Frontmatter Fields

- `title`: The blog post title
- `date`: Publication date in YYYY-MM-DD format (handled in local timezone)
- `language`: Language code (e.g., "en", "zh", "fr", "es") - defaults to "en" if not specified

## Markdown Support

The system supports basic markdown:
- Headers: `#`, `##`, `###`
- Paragraphs: Automatic
- Links: `[text](url)`
- Bold: `**text**`
- Italic: `*text*`

## Automatic Features

- **True automatic discovery:** Blogs are discovered by scanning the directory
- **No manual updates needed:** Just create a .md file and it appears
- **Automatic sorting:** Blogs are sorted by date (newest first)
- **Markdown rendering:** Content is rendered from markdown to HTML
- **Unique URLs:** Each blog post has its own URL with hash fragments
- **Browser navigation:** Back/forward buttons work correctly
- **Direct linking:** You can link directly to specific blog posts
- **Language indicators:** Language codes are displayed next to blog titles
- **Single-page navigation:** Navigate between blog list and individual posts

## URL Structure

Each blog post has a unique URL using hash fragments:

- **Blog list:** `writings.html` (no hash)
- **Individual blog:** `writings.html#filename` (where filename is the blog file name without .md)

Examples:
- `writings.html` - Shows the list of all blogs
- `writings.html#2025-10-23-marvelous-realism` - Shows the specific blog post

## How It Works

The system uses a JSON file (`blog-list.json`) that contains the list of all blog files:

1. **JavaScript loads** `blog-list.json` to get the list of blog files
2. **Each blog file** is then loaded and parsed from markdown
3. **Marked library** converts markdown to HTML on the client side
4. **Blogs are sorted** by date automatically
5. **Content is rendered** in the browser with consistent styling
6. **URL routing** handles navigation between blog list and individual posts

## Workflow

1. **Add new blog:** Create `new-blog.md` in the `../posts/` folder
2. **Update list:** Run `python3 ../update-blog-list.py`
3. **Refresh website:** The new blog appears automatically

## Example

To add a new blog called "my-awesome-post.md":

1. Create `my-awesome-post.md` in the `../posts/` folder
2. Run `python3 ../update-blog-list.py`
3. Refresh your website
4. Done! The blog appears in the list automatically

## Files

- `../posts/*.md` - Your blog post files
- `blog-list.json` - JSON file containing the list of blog files
- `../update-blog-list.py` - Script to update the blog list
- `../blog-system.js` - JavaScript that loads and renders blogs
