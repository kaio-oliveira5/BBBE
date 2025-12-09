const { SignaturePad } = window;
let dirPad;

function setupPads(){
    const canvas = document.getElementById("pad-diretor");
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);

    dirPad = new SignaturePad(canvas, {
        backgroundColor: "white",
        penColor: "black"
    });
}
window.onload = setupPads;

document.getElementById("limpar").addEventListener("click", () => {
    dirPad.clear();
});

/* ENVIO FINAL PARA ASSESSOR */
document.getElementById("formDiretor").addEventListener("submit", (e) => {
    if (dirPad.isEmpty()){
        e.preventDefault();
        alert("A assinatura do diretor é obrigatória.");
        return;
    }

    // Converte assinatura para base64 e envia como hidden input
    const assinaturaBase64 = dirPad.toDataURL("image/png");
    document.getElementById("assinatura_diretor").value = assinaturaBase64;
});