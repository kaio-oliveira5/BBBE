// ===== Animação suave ao carregar =====
document.addEventListener("DOMContentLoaded", () => {
    const principalBtn = document.querySelector(".glow-btn");

    if (principalBtn) {
        principalBtn.style.opacity = "0";
        principalBtn.style.transform = "translateY(10px)";

        setTimeout(() => {
            principalBtn.style.transition = "0.6s";
            principalBtn.style.opacity = "1";
            principalBtn.style.transform = "translateY(0)";
        }, 150);
    }
});

// ===== Evitar duplo clique no botão =====
const link = document.querySelector(".glow-btn");

if (link) {
    link.addEventListener("click", () => {
        link.style.pointerEvents = "none";
        setTimeout(() => {
            link.style.pointerEvents = "auto";
        }, 2000); // evita spam
    });
}