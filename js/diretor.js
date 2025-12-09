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

function clearPad(){ dirPad.clear(); }

/* ================================================
   ENVIO PARA A SECRETARIA
================================================ */
document.getElementById("btnEnviarDiretor").addEventListener("click", async () => {

    const alunoNome = document.getElementById("aluno_nome").value.trim();
    if (!alunoNome){
        alert("Erro: nome do aluno não carregou.");
        return;
    }

    const diretorNome = document.getElementById("diretor_nome").value.trim();
    if (!diretorNome){
        alert("Preencha o nome do diretor.");
        return;
    }

    const diretorData = document.getElementById("diretor_data").value;
    if (!diretorData){
        alert("Informe a data da assinatura.");
        return;
    }

    if (dirPad.isEmpty()){
        alert("A assinatura do diretor é obrigatória.");
        return;
    }

    // Converter assinatura para arquivo PNG
    const assinaturaDiretor = dirPad.toDataURL("image/png");
    const assinaturaBlob = await (await fetch(assinaturaDiretor)).blob();
    const assinaturaFile = new File([assinaturaBlob], "Assinatura_Diretor.png", {
        type: "image/png"
    });

    // Envio
    const formData = new FormData();
    formData.append("_captcha", "false");
    formData.append("_subject", `Ficha BBBE — Assinatura do Diretor (${alunoNome})`);

    formData.append("Aluno", alunoNome);
    formData.append("Diretor", diretorNome);
    formData.append("Data_Assinatura", diretorData);
    formData.append("Assinatura_Diretor", assinaturaFile);

    // Envia SOMENTE para você
    const endpoint = "https://formsubmit.co/assessor.esportes@carlosbarbosa.rs.gov.br";

    await fetch(endpoint, {
        method: "POST",
        body: formData
    });

    alert("Assinatura enviada com sucesso para a Secretaria!");
});