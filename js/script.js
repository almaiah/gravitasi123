// Handle splash screen
document.addEventListener('DOMContentLoaded', function() {
    const splashScreen = document.getElementById('splash-screen');
    
    // Hide splash screen after 3 seconds
    setTimeout(function() {
        splashScreen.style.opacity = '0';
        setTimeout(function() {
            splashScreen.style.display = 'none';
        }, 1000);
    }, 3000);

    // Navigation functions
    function navigateToPage(page) {
        window.location.href = page;
    }

    // Add event listeners for navigation
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const pageId = this.id.replace('view-', '');
            const pageName = pageId.charAt(0).toUpperCase() + pageId.slice(1).replace(/-/g, '-') + '.html';
            navigateToPage(pageName);
        });
    });
});