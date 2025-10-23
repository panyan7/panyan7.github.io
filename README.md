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
- `sidebar.html` - Sidebar content (shared across all pages)
- `pages/` - Folder containing all page files
  - `home.html` - Home page
  - `about.html` - About page
  - `projects.html` - Projects page
  - `contact.html` - Contact page
- `styles.css` - CSS styling
- `script.js` - JavaScript for navigation and dynamic sidebar loading
- `README.md` - This file

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

## Deployment to GitHub Pages

1. Create a new repository on GitHub
2. Upload all files to the repository
3. Go to repository Settings > Pages
4. Select "Deploy from a branch" and choose "main" branch
5. Your site will be available at `https://yourusername.github.io/repository-name`

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
