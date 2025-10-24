// Blog System - Markdown parser and blog list generator
class BlogSystem {
    constructor() {
        this.blogs = [];
        this.init();
    }

    async init() {
        await this.loadBlogs();
        this.renderBlogList();
    }

    async loadBlogs() {
        // List of blog files (in order of creation/importance)
        const blogFiles = [
            'deep-learning-fundamentals.md',
            'generative-models-overview.md',
            'machine-learning-optimization.md',
            'computer-vision-applications.md',
            'natural-language-processing.md'
        ];

        for (const file of blogFiles) {
            try {
                const response = await fetch(`../blogs/${file}`);
                if (response.ok) {
                    const markdown = await response.text();
                    const blog = this.parseMarkdown(markdown, file);
                    this.blogs.push(blog);
                }
            } catch (error) {
                console.error(`Error loading blog ${file}:`, error);
            }
        }

        // Sort blogs by date (newest first)
        this.blogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    parseMarkdown(markdown, filename) {
        // Parse frontmatter
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
        const match = markdown.match(frontmatterRegex);
        
        if (!match) {
            throw new Error(`Invalid markdown format in ${filename}`);
        }

        const frontmatter = match[1];
        const content = match[2];

        // Parse frontmatter fields
        const title = this.extractFrontmatterField(frontmatter, 'title');
        const date = this.extractFrontmatterField(frontmatter, 'date');
        const excerpt = this.extractFrontmatterField(frontmatter, 'excerpt');

        return {
            filename: filename.replace('.md', ''),
            title,
            date,
            excerpt,
            content: this.parseMarkdownContent(content)
        };
    }

    extractFrontmatterField(frontmatter, field) {
        const regex = new RegExp(`^${field}:\\s*["']?(.*?)["']?$`, 'm');
        const match = frontmatter.match(regex);
        return match ? match[1].trim() : '';
    }

    parseMarkdownContent(content) {
        // Simple markdown to HTML converter
        let html = content;
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Paragraphs
        html = html.replace(/^(?!<[h1-6])(.+)$/gim, '<p>$1</p>');
        
        // Clean up multiple paragraph tags
        html = html.replace(/<\/p>\s*<p>/g, '\n\n');
        
        return html;
    }

    renderBlogList() {
        const blogListContainer = document.getElementById('blog-list');
        if (!blogListContainer) return;

        let html = '';
        this.blogs.forEach(blog => {
            html += `
                <div class="blog-item">
                    <h3><a href="#" onclick="blogSystem.loadBlog('${blog.filename}')">${blog.title}</a></h3>
                    <p class="blog-date">${this.formatDate(blog.date)}</p>
                    <p class="blog-excerpt">${blog.excerpt}</p>
                </div>
            `;
        });

        blogListContainer.innerHTML = html;
    }

    loadBlog(filename) {
        const blog = this.blogs.find(b => b.filename === filename);
        if (!blog) return;

        // Update the page content
        const pageContent = document.querySelector('.page.active');
        if (pageContent) {
            pageContent.innerHTML = `
                <div class="blog-post">
                    <h2>${blog.title}</h2>
                    <p class="blog-meta">${this.formatDate(blog.date)}</p>
                    <div class="blog-content">${blog.content}</div>
                    <div class="blog-navigation">
                        <a href="#" onclick="blogSystem.showBlogList()">← Back to Writings</a>
                    </div>
                </div>
            `;
        }
    }

    showBlogList() {
        const pageContent = document.querySelector('.page.active');
        if (pageContent) {
            pageContent.innerHTML = `
                <h2>Writings</h2>
                <p>Here you'll find my thoughts on machine learning, technology, and various topics that interest me. I write about research insights, technical concepts, and personal reflections.</p>
                
                <div id="blog-list"></div>
            `;
            this.renderBlogList();
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Initialize blog system when DOM is loaded
let blogSystem;
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on writings page
    if (window.location.pathname.includes('writings.html')) {
        blogSystem = new BlogSystem();
    }
});
