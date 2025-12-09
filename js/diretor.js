/* ================================================
   CONFIGURAÇÃO DE ASSINATURA
================================================ */
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

/* LIMPAR PAD */
document.getElementById("limpar").addEventListener("click", () => {
    dirPad.clear();
});

/* ================================================
   ENVIO FINAL PARA O ASSESSOR
================================================ */
document.getElementById("btnEnviarDiretor").addEventListener("click", async () => {

    const alunoNome = document.getElementById("aluno_nome").value.trim();
    const diretorNome = document.getElementById("diretor_nome").value.trim();
    const diretorData = document.getElementById("diretor_data").value;

    if (!alunoNome || !diretorNome || !diretorData){
        alert("Preencha todos os campos obrigatórios.");
        return;
    }

    if (dirPad.isEmpty()){
        alert("A assinatura do diretor é obrigatória.");
        return;
    }

    // CONVERTE ASSINATURA
    const assinaturaBase64 = dirPad.toDataURL("image/png");
    const assinaturaBlob = await (await fetch(assinaturaBase64)).blob();
    const assinaturaFile = new File([assinaturaBlob], "Assinatura_Diretor.png", {
        type: "image/png"
    });

    // MONTAGEM DO ENVIO
    const formData = new FormData();
    formData.append("_captcha", "false");
    formData.append("_subject", `Projeto BBBE — Assinatura do Diretor (${alunoNome})`);
    formData.append("Aluno", alunoNome);
    formData.append("Diretor", diretorNome);
    formData.append("Data_Assinatura", diretorData);
    formData.append("Assinatura_Diretor", assinaturaFile);

    // EMAIL DO ASSESSOR
    const endpoint = "https://formsubmit.co/assessor.esportes@carlosbarbosa.rs.gov.br";

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            body: formData
        });

        if (!response.ok){
            throw new Error("Erro ao enviar formulário");
        }

        alert("Assinatura enviada com sucesso! A Secretaria recebeu o documento.");
        window.location.href = "https://bbbe.vercel.app/sucesso.html";

    } catch (error) {
        console.error(error);
        alert("Erro ao enviar. Tente novamente.");
    }
});