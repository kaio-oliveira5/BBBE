// 1. Captura de Foto
document.getElementById("foto_aluno").addEventListener("change", function (e) {
    const fotoInput = e.target;
    if (fotoInput.files && fotoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            // Aqui você pode fazer algo com a foto capturada, como exibir ela num preview
            console.log("Foto carregada: ", e.target.result);
        };
        reader.readAsDataURL(fotoInput.files[0]);
    }
});

// 2. Máscara CPF e Telefone
const cpfInput = document.getElementById("cpf");
if (cpfInput) {
    cpfInput.addEventListener("input", () => {
        let value = cpfInput.value.replace(/\D/g, "");
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

const telefoneInputs = document.querySelectorAll('input[type="tel"]');
telefoneInputs.forEach(input => {
    input.addEventListener("input", function () {
        let value = input.value.replace(/\D/g, "");
        if (value.length > 1) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
        }
        input.value = value;
    });
});

// 3. Assinatura
const { SignaturePad } = window;
let resPad;

function setupPads() {
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

function clearPad(p) { p.clear(); }

// 4. Validação de campos
function validaCampos() {
    if (!document.getElementById("nome_aluno").value.trim()) {
        alert("Preencha o nome do aluno.");
        return false;
    }
    if (!document.getElementById("responsavel_nome").value.trim()) {
        alert("Preencha o nome do responsável.");
        return false;
    }
    if (resPad.isEmpty()) {
        alert("A assinatura do responsável é obrigatória.");
        return false;
    }
    const escolaEmail = document.getElementById("escola_selecionada").value;
    if (!escolaEmail) {
        alert("Selecione a escola.");
        return false;
    }
    return true;
}

// 5. Gerar PDF
document.getElementById("btnEnviar").addEventListener("click", async () => {
    if (!validaCampos()) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    let y = 40;
    const left = 40;

    doc.setFontSize(18);
    doc.text("Projeto BBBE - Inscrição (Responsável)", left, y);
    y += 30;

    function addLine(label, value) {
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

    // DADOS DOS RESPONSÁVEIS
    y += 10;
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

    // NÚCLEO
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Núcleo", left, y);
    y += 20;

    addLine("Núcleo", document.getElementById("nucleo").value);
    addLine("Turno do treino", document.getElementById("turno_projeto").value);

    // ASSINATURA
    y += 20;
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
    if (fotoInput.files.length > 0) {
        const foto = fotoInput.files[0];
        const fotoURL = await fileToBase64(foto);
        doc.addImage(fotoURL, "JPEG", left, y, 120, 120);
    }

    const pdfBlob = doc.output("blob");
    const pdfFile = new File([pdfBlob], "Ficha_Responsavel.pdf", { type: "application/pdf" });

    // 6. ENVIAR PARA A ESCOLA CORRETA E CÓPIA PARA O ASSESSOR
    const emailsEscolas = {
        "Escola A": "teste@escolaA.com",
        "Escola B": "teste@escolaB.com",
        "Escola C": "teste@escolaC.com"
    };

    const escolaEmail = document.getElementById("escola_selecionada").value;
    const assessorEmail = "assessor.esportes@carlosbarbosa.rs.gov.br";  // Email do assessor
    const emailBackupExtra = "";  // Email extra de backup, se necessário

    const formData = new FormData();
    formData.append("_captcha", "false");
    formData.append("PDF_Responsavel", pdfFile);

    if (fotoInput.files.length > 0) {
        formData.append("Foto_Aluno", fotoInput.files[0]);
    }

    formData.append("_cc", assessorEmail);

    // Envio para a escola
    const endpoint = `https://formsubmit.co/${emailsEscolas[escolaEmail] || "teste@escola.com"}`;
    await fetch(endpoint, {
        method: "POST",
        body: formData
    });

    // Enviar para o segundo e-mail de backup, se definido
    if (emailBackupExtra) {
        formData.append("_cc", emailBackupExtra);
        await fetch(`https://formsubmit.co/${emailBackupExtra}`, {
            method: "POST",
            body: formData
        });
    }

    alert("Ficha enviada com sucesso! O diretor recebeu o e-mail com o link para assinar.");
});

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}