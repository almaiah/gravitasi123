// Handle navigation between pages
document.addEventListener('DOMContentLoaded', function() {
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