// Blog System - Markdown parser and blog list generator
class BlogSystem {
    constructor() {
        this.blogs = [];
        this.originalContent = null;
        this.init();
    }

    async init() {
        // Store the original content
        const pageContent = document.querySelector('.page.active');
        if (pageContent) {
            this.originalContent = pageContent.innerHTML;
        }
        
        await this.loadBlogs();
        this.handleNavigation();
    }

    async loadBlogs() {
        try {
            // Try to get the list of blog files from the JSON file
            const response = await fetch('../writings/blog-list.json');
            
            if (response.ok) {
                const data = await response.json();
                const blogFiles = data.files;

                console.log('Found blog files:', blogFiles);
                
                // Load each blog file (markdown files)
                for (const file of blogFiles) {
                    try {
                        const blogResponse = await fetch(`../posts/${file}`);
                        if (blogResponse.ok) {
                            const markdown = await blogResponse.text();
                            const blog = this.parseMarkdown(markdown, file);
                            this.blogs.push(blog);
                        }
                    } catch (error) {
                        console.error(`Error loading blog ${file}:`, error);
                    }
                }
            } else {
                // Fallback: try to load known files if JSON file is not available
                await this.loadFallbackBlogs();
            }
        } catch (error) {
            console.error('Error fetching blog list, using fallback:', error);
            await this.loadFallbackBlogs();
        }

        // Sort blogs by date (newest first)
        this.blogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    handleNavigation() {
        // Check if we're viewing a specific blog post
        const hash = window.location.hash.substring(1); // Remove the #
        
        if (hash) {
            // Load the specific blog post
            this.loadBlog(hash);
        } else {
            // Show the blog list
            this.renderBlogList();
        }
        
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            const newHash = window.location.hash.substring(1);
            if (newHash) {
                this.loadBlog(newHash);
            } else {
                this.showBlogList();
            }
        });
    }

    async loadFallbackBlogs() {
        // Fallback method when JSON file is not available
        const fallbackFiles = [];

        for (const file of fallbackFiles) {
            try {
                const response = await fetch(`../posts/${file}`);
                if (response.ok) {
                    const markdown = await response.text();
                    const blog = this.parseMarkdown(markdown, file);
                    this.blogs.push(blog);
                }
            } catch (error) {
                console.error(`Error loading fallback blog ${file}:`, error);
            }
        }
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
        const titleEn = this.extractFrontmatterField(frontmatter, 'title_en');
        const date = this.extractFrontmatterField(frontmatter, 'date');
        const language = this.extractFrontmatterField(frontmatter, 'language') || 'en';
        const background = this.extractFrontmatterFieldMultiLine(frontmatter, 'background');

        return {
            filename: filename.replace('.md', ''),
            title,
            titleEn,
            date,
            language,
            background: background,
            content: this.parseMarkdownContent(content)
        };
    }

    extractFrontmatterField(frontmatter, field) {
        const regex = new RegExp(`^${field}:\\s*["']?(.*?)["']?$`, 'm');
        const match = frontmatter.match(regex);
        return match ? match[1].trim() : '';
    }

    extractFrontmatterFieldMultiLine(frontmatter, field) {
        // Try to match single line first
        const singleLineRegex = new RegExp(`^${field}:\\s*["']?([^"'\n]*)["']?$`, 'm');
        const singleMatch = frontmatter.match(singleLineRegex);
        if (singleMatch) return singleMatch[1].trim();
        
        // Try to match multiline with quotes
        const multiLineRegex = new RegExp(`^${field}:\\s*["']([\\s\\S]*?)["']$`, 'm');
        const multiMatch = frontmatter.match(multiLineRegex);
        if (multiMatch) return multiMatch[1].trim();
        
        // Try to match multiline without quotes (until next field or end)
        const noQuotesRegex = new RegExp(`^${field}:\\s*([\\s\\S]*?)(?=\\n[A-Za-z_][A-Za-z0-9_]*:|$)`, 'm');
        const noQuotesMatch = frontmatter.match(noQuotesRegex);
        return noQuotesMatch ? noQuotesMatch[1].trim() : '';
    }

    parseMarkdownContent(content) {
        // Use marked library for better markdown conversion
        if (typeof marked !== 'undefined') {
            return marked.parse(content);
        } else {
            console.log('Using fallback markdown to HTML converter');
            // Fallback simple markdown to HTML converter
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
    }

    renderBlogList() {
        const blogListContainer = document.getElementById('blog-list');
        if (!blogListContainer) return;

        let html = '';
        this.blogs.forEach(blog => {
            const englishTitle = blog.titleEn ? `<div class="blog-title-en">${blog.titleEn}</div>` : '';
            html += `
                <div class="blog-item">
                    <div class="blog-title-row">
                        <span class="blog-date-condensed">${this.formatDateCondensed(blog.date)}</span>
                        <div class="blog-title-container">
                            <h3 class="blog-title"><a href="#${blog.filename}">${blog.title}</a></h3>
                            ${englishTitle}
                        </div>
                    </div>
                </div>
            `;
        });

        blogListContainer.innerHTML = html;
    }

    loadBlog(filename) {
        const blog = this.blogs.find(b => b.filename === filename);
        if (!blog) return;

        // Update the URL hash
        window.location.hash = filename;

        // Update the page content
        const pageContent = document.querySelector('.page.active');
        if (pageContent) {
            const backgroundSection = blog.background ? `
                <div class="background-section">
                    <div class="background-header" onclick="this.parentElement.classList.toggle('expanded')">
                        <span class="background-title">Background</span>
                        <span class="background-toggle">▼</span>
                    </div>
                    <div class="background-content">${this.parseMarkdownContent(blog.background)}</div>
                </div>
            ` : '';
            
            pageContent.innerHTML = `
                <div class="blog-post">
                    <h2>${blog.title}</h2>
                    <p class="blog-meta">${this.formatDate(blog.date)}</p>
                    ${backgroundSection}
                    <div class="blog-content">${blog.content}</div>
                    <div class="blog-navigation">
                        <a href="#">← Back to Writings</a>
                    </div>
                </div>
            `;
        }
    }

    showBlogList() {
        // Clear the URL hash
        window.location.hash = '';

        const pageContent = document.querySelector('.page.active');
        if (pageContent && this.originalContent) {
            // Restore the original content
            pageContent.innerHTML = this.originalContent;
            this.renderBlogList();
        }
    }

    formatDate(dateString) {
        // Parse the date string and create a date in local timezone
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day); // month is 0-indexed
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatDateCondensed(dateString) {
        // Parse the date string and create a date in local timezone
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day); // month is 0-indexed
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            year: '2-digit'
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
