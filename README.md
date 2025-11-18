# Personal Website

A minimalist personal website designed for GitHub Pages hosting.

## Features

- Clean, minimalist design with white background
- Responsive layout with left sidebar navigation
- Multi-page navigation with separate HTML files
- Mobile-friendly design
- Easy to customize and deploy

## Structure

- `index.html` - Redirects to home page
- `package.json` - Build configuration and scripts for project submodules
- `sidebar.html` - Sidebar content (shared across all pages)
- `pages/` - Folder containing all page files
  - `home.html` - Home page
  - `about.html` - About page
  - `writings.html` - Writings page
- `projects/` - Folder containing project submodules
  - `163.html` - Redirect page for the 163 game
  - `163/` - 163-solver submodule (git submodule)
- `posts/` - Folder containing blog post markdown files
- `writings/` - Blog system files and configuration
  - `blog-list.json` - List of blog files
  - `README.md` - Blog system documentation
- `styles.css` - CSS styling
- `script.js` - JavaScript for navigation and dynamic sidebar loading
- `blog-system.js` - JavaScript for blog loading and rendering
- `update-blog-list.py` - Script to update the blog list
- `README.md` - This file

## Building the Website

This website includes project submodules that need to be built before deployment.

### Initial Setup

1. **Clone the repository with submodules:**
   ```bash
   git clone --recurse-submodules <repository-url>
   ```
   
   If you've already cloned without submodules:
   ```bash
   git submodule update --init --recursive
   ```

2. **Install dependencies:**
   ```bash
   npm install
   npm run install:all
   ```

### Building

To build all project submodules:
```bash
npm run build
```

To build a specific project:
```bash
npm run build:163
```

### Available Build Scripts

- `npm run build` - Builds all projects (currently just 163-solver)
- `npm run build:163` - Builds the 163 game project
- `npm run watch:163` - Watches for changes and rebuilds automatically (for development)
- `npm run install:all` - Installs dependencies for all submodules
- `npm run install:163` - Installs dependencies for the 163 project

### Project Submodules

- **163-solver** (`projects/163/`) - A game solver project
  - Accessible at `/projects/163.html` (redirects to `/projects/163/web/index.html`)
  - Requires TypeScript compilation to build `web/dist/main.js`

**Note:** Always run `npm run build` before deploying to ensure all projects are built with the latest changes.

## Development and Updates

### For Automatic Updates During Development

**Option 1: Use Python HTTP Server (Recommended)**
```bash
# Navigate to your website folder
cd /path/to/your/website

# Start a local server (Python 3)
python3 -m http.server 8000

# Or with Python 2
python -m SimpleHTTPServer 8000

# Then open http://localhost:8000 in your browser
```

**Option 2: Use Node.js HTTP Server**
```bash
# Install http-server globally
npm install -g http-server

# Navigate to your website folder and start server
cd /path/to/your/website
http-server

# Then open http://localhost:8080 in your browser
```

**Option 3: Manual Cache Clearing**
- Press `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac) to force refresh
- Or open Developer Tools (F12) → Network tab → check "Disable cache"

### Updating the Sidebar
To update the sidebar across all pages, simply edit the `sidebarTemplate` variable in `script.js` (lines 23-39).

### For Blog System

The blog system automatically discovers and renders markdown files from the `posts/` folder:

1. **Add new blog:** Create a new `.md` file in the `posts/` folder
2. **Update list:** Run `python3 update-blog-list.py` to update the blog list
3. **Automatic rendering:** The system automatically finds and renders the new blog

The system includes:
- **JSON-based discovery:** Uses `writings/blog-list.json` to track blog files
- **Markdown rendering:** Converts markdown to HTML
- **Date sorting:** Blogs are automatically sorted by date (newest first)
- **Single-page navigation:** Navigate between blog list and individual posts

For more details, see `writings/README.md`.

## Deployment to GitHub Pages

1. **Build the website:**
   ```bash
   npm run build
   ```

2. Create a new repository on GitHub (or use existing)
3. Upload all files to the repository
4. Go to repository Settings > Pages
5. Select "Deploy from a branch" and choose "main" branch
6. Your site will be available at `https://yourusername.github.io/repository-name`

**Important:** Make sure to run `npm run build` before committing and pushing to ensure all project submodules are built.

## Customization

### Personal Information
Edit the following in `index.html`:
- Change "Your Name" in the sidebar header
- Update the job title/description
- Modify contact information in the Contact page
- Add your actual projects and descriptions

### Styling
Customize `styles.css` to:
- Change colors (currently using a monochromatic scheme)
- Adjust fonts and typography
- Modify spacing and layout
- Add your own branding elements

### Content
Update the page content in `index.html`:
- Home page welcome message
- About page with your background and skills
- Projects page with your actual projects
- Contact page with your information

## Browser Support

This website works in all modern browsers including:
- Chrome
- Firefox
- Safari
- Edge

## License

Feel free to use this template for your own personal website.
