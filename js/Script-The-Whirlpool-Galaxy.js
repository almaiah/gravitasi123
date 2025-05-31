 function closeWelcome() {
    const welcome = document.getElementById("welcome-screen");
    welcome.style.transition = "opacity 1s ease-out";
    welcome.style.opacity = 0;
    setTimeout(() => {
      welcome.style.display = "none";
    }, 1000);
  }

  // Optional: auto-close after beberapa detik (misal 6 detik)
  // setTimeout(closeWelcome, 6000);