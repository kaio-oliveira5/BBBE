/* ================================================
   CONFIGURAÇÃO DE ASSINATURA
================================================ */
const { SignaturePad } = window;
let resPad;

function setupPads(){
    const canvas = document.getElementById("pad-resp");

    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);

    resPad = new SignaturePad(canvas, {
        backgroundColor: "white",
        penColor: "black"
    });
}
window.onload = setupPads;

function clearPad(p){ p.clear(); }

/* ================================================
   BOTÃO DE ENVIO
================================================ */
document.getElementById("btnEnviar").addEventListener("click", async () => {

    // VALIDAÇÕES
    if (!document.getElementById("nome_aluno").value.trim()){
        alert("Preencha o nome do aluno.");
        return;
    }
    if (!document.getElementById("responsavel_nome").value.trim()){
        alert("Preencha o nome do responsável.");
        return;
    }
    if (resPad.isEmpty()){
        alert("A assinatura do responsável é obrigatória.");
        return;
    }
    const escolaEmail = document.getElementById("escola_selecionada").value;
    if(!escolaEmail){
        alert("Selecione a escola.");
        return;
    }

    // ===========================================
    // GERAR PDF
    // ===========================================
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit:"pt", format:"a4" });

    let y = 40;
    const left = 40;

    doc.setFontSize(18);
    doc.text("Projeto BBBE - Inscrição (Responsável)", left, y);
    y += 30;

    function addLine(label, value){
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(label + ":", left, y);
        doc.setFont("helvetica", "normal");
        doc.text(value || "-", left + 150, y);
        y += 18;
    }

    // DADOS DO ALUNO
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Dados do Aluno", left, y);
    y += 20;

    addLine("Nome do aluno", document.getElementById("nome_aluno").value);
    addLine("Data de nascimento", document.getElementById("data_nascimento").value);
    addLine("CPF", document.getElementById("cpf").value);
    addLine("Endereço", document.getElementById("endereco").value);
    addLine("Número", document.getElementById("numero").value);
    addLine("Complemento", document.getElementById("complemento").value);
    addLine("Bairro", document.getElementById("bairro").value);
    addLine("Email", document.getElementById("email").value);
    addLine("Celular", document.getElementById("celular").value);
    addLine("Whatsapp", document.getElementById("whatsapp").value);
    addLine("Escola", document.getElementById("escola_selecionada").options[document.getElementById("escola_selecionada").selectedIndex].text);
    addLine("Turno escolar", document.getElementById("turno_escola").value);

    y += 10;

    // DADOS DOS RESPONSÁVEIS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Dados dos Responsáveis", left, y);
    y += 20;

    addLine("Nome do pai", document.getElementById("nome_pai").value);
    addLine("Celular do pai", document.getElementById("celular_pai").value);
    addLine("Nome da mãe", document.getElementById("nome_mae").value);
    addLine("Celular da mãe", document.getElementById("celular_mae").value);
    addLine("Outros contatos", document.getElementById("outros_contatos").value);
    addLine("Contato de urgência", document.getElementById("urgencia").value);
    addLine("Telefone urgência", document.getElementById("telefone_urgencia").value);

    y += 10;

    // NÚCLEO
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Núcleo", left, y);
    y += 20;

    addLine("Núcleo", document.getElementById("nucleo").value);
    addLine("Turno do treino", document.getElementById("turno_projeto").value);

    y += 20;

    // ASSINATURA DO RESPONSÁVEL
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Assinatura do Responsável", left, y);
    y += 20;

    addLine("Responsável", document.getElementById("responsavel_nome").value);
    addLine("Data", document.getElementById("responsavel_data").value);

    y += 10;

    const assinaturaResp = resPad.toDataURL("image/png");
    doc.addImage(assinaturaResp, "PNG", left, y, 200, 80);
    y += 100;

    // FOTO DO ALUNO
    const fotoInput = document.getElementById("foto_aluno");
    if (fotoInput.files.length > 0){
        const foto = fotoInput.files[0];
        const fotoURL = await fileToBase64(foto);
        doc.addImage(fotoURL, "JPEG", left, y, 120, 120);
    }

    const pdfBlob = doc.output("blob");
    const pdfFile = new File([pdfBlob], "Ficha_Responsavel.pdf", { type:"application/pdf" });

    // ===========================================
    // ENVIO PARA FORM SUBMIT (ESCOLA/DIRETOR + ASSESSOR)
    // ===========================================
    const assessorEmail = "assessor.esportes@carlosbarbosa.rs.gov.br";
    const diretorEmail = escolaEmail; // e-mail do diretor vindo do select

    // monta o link do diretor (usando seu domínio fornecido)
    const baseDiretorURL = "https://bbbe.vercel.app/diretor.html";
    const nomeAluno = document.getElementById("nome_aluno").value.trim();
    const urlDiretor = `${baseDiretorURL}?aluno=${encodeURIComponent(nomeAluno)}`;

    const formData = new FormData();
    formData.append("_captcha", "false");

    // anexa o PDF
    formData.append("PDF_Responsavel", pdfFile);

    // se existir foto, anexa também
    if (fotoInput.files.length > 0){
        formData.append("Foto_Aluno", fotoInput.files[0]);
    }

    // campo extra com o link para o diretor assinar (aparecerá no email)
    formData.append("Link_para_assinatura_do_diretor", urlDiretor);

    // envia cópia para o assessor
    formData.append("_cc", assessorEmail);

    // endpoint principal é o e-mail do diretor (value do select)
    const endpoint = `https://formsubmit.co/${diretorEmail}`;

    await fetch(endpoint, {
        method: "POST",
        body: formData
    });

    alert("Ficha enviada com sucesso! O diretor recebeu o e-mail com o link para assinar.");
});

/* CONVERTER FOTO EM BASE64 */
function fileToBase64(file){
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/* MÁSCARA DE CPF */
const cpfInput = document.getElementById("cpf");
if (cpfInput){
    cpfInput.addEventListener("input", () => {
        let value = cpfInput.value;
        value = value.replace(/\D/g, "");

        if (value.length > 3 && value.length <= 6) {
            value = value.replace(/(\d{3})(\d+)/, "$1.$2");
        } 
        else if (value.length > 6 && value.length <= 9) {
            value = value.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
        } 
        else if (value.length > 9) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4");
        }
        cpfInput.value = value;
    });
}