// Handle splash screen and welcome screen transitions
document.addEventListener('DOMContentLoaded', function() {
    const splashScreen = document.getElementById('splash-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    
    // Hide splash screen after 3 seconds
    setTimeout(function() {
        splashScreen.style.opacity = '0';
        setTimeout(function() {
            splashScreen.style.display = 'none';
            if (welcomeScreen) {
                welcomeScreen.style.opacity = '1';
            }
        }, 1000);
    }, 3000);
});