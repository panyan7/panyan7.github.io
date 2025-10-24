// Dynamic sidebar loading and navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load sidebar dynamically
    loadSidebar();
    
    // Add smooth scrolling for anchor links (if any)
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

function loadSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        // Try to fetch from sidebar.html first (works on server)
        fetch('../sidebar.html?t=' + Date.now())
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch sidebar');
                }
                return response.text();
            })
            .then(html => {
                sidebarContainer.innerHTML = html;
                setActiveNavigationLink();
            })
            .catch(error => {
                console.log('Fetch failed, using fallback sidebar');
                // Fallback: use template if fetch fails (for local file:// protocol)
                const sidebarTemplate = `
                    <nav class="sidebar">
                        <div class="nav-header">
                            <h1>Yan Pan</h1>
                        </div>
                        <ul class="nav-links">
                            <li><a href="home.html" class="nav-link">Home</a></li>
                            <li><a href="about.html" class="nav-link">About</a></li>
                            <li><a href="projects.html" class="nav-link">Projects</a></li>
                            <li><a href="https://www.instagram.com/yanpanphoto/" class="nav-link" target="_blank" rel="noopener">Photo</a></li>
                        </ul>
                        <div class="nav-footer">
                            <p>&copy; 2024 Yan Pan</p>
                        </div>
                    </nav>
                `;
                sidebarContainer.innerHTML = sidebarTemplate;
                setActiveNavigationLink();
            });
    }
}

function setActiveNavigationLink() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPage = window.location.pathname.split('/').pop();
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage || (currentPage === '' && linkHref === 'home.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}
