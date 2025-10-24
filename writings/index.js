// Node.js script to list all .md files in the blogs directory
// This provides a JSON API endpoint for the JavaScript to discover blog files

const fs = require('fs');
const path = require('path');

// Simple HTTP server to serve the blog list
const http = require('http');

const server = http.createServer((req, res) => {
    if (req.url === '/blogs/index.js' || req.url === '/blogs/') {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        
        try {
            const blogsDir = __dirname;
            const files = [];
            
            // Scan the directory for .md files
            const items = fs.readdirSync(blogsDir);
            items.forEach(item => {
                if (item.endsWith('.md')) {
                    files.push(item);
                }
            });
            
            // Sort files alphabetically
            files.sort();
            
            // Return JSON response
            const response = {
                files: files,
                count: files.length,
                generated: new Date().toISOString()
            };
            
            res.end(JSON.stringify(response));
        } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
        }
    } else {
        res.statusCode = 404;
        res.end('Not found');
    }
});

// Only start server if this file is run directly
if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
        console.log(`Blog API server running on port ${PORT}`);
        console.log(`Access at: http://localhost:${PORT}/blogs/`);
    });
}

module.exports = server;
