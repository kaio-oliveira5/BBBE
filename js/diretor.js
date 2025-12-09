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

function clearPad(){
    dirPad.clear();
}

/* ENVIO */
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

    const assinaturaDiretor = dirPad.toDataURL("image/png");
    const blob = await (await fetch(assinaturaDiretor)).blob();

    const assinaturaFile = new File([blob], "Assinatura_Diretor.png", {
        type: "image/png"
    });

    const formData = new FormData();
    formData.append("_captcha", "false");
    formData.append("_subject", `BBBE — Assinatura do Diretor (${alunoNome})`);
    formData.append("Aluno", alunoNome);
    formData.append("Diretor", diretorNome);
    formData.append("Data_Assinatura", diretorData);
    formData.append("Assinatura_Diretor", assinaturaFile);

    // Somente para o assessor
    const endpoint = "https://formsubmit.co/assessor.esportes@carlosbarbosa.rs.gov.br";

    await fetch(endpoint, {
        method: "POST",
        body: formData
    });

    alert("Assinatura enviada com sucesso para a Secretaria!");
});