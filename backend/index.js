// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' })); // aceitar base64 grandes
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const PORT = process.env.PORT || 3000;
const ASSISTANT_EMAIL = process.env.ASSISTANT_EMAIL || 'assessor.esportes@carlosbarbosa.rs.gov.br';

// Helpers
function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function base64ToFile(base64Data, filePath) {
    // base64Data = data:<mime>;base64,AAAA...
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches) throw new Error('Formato base64 inválido');
    const buffer = Buffer.from(matches[2], 'base64');
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

function createPdfFromData(data, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            ensureDir(path.dirname(outputPath));
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            doc.fontSize(18).text('Ficha Projeto BBBE', { align: 'center' });
            doc.moveDown();

            doc.fontSize(13).text(`Nome do aluno: ${data.nome_aluno || '-'}`);
            doc.text(`Data de nascimento: ${data.data_nascimento || '-'}`);
            doc.text(`CPF: ${data.cpf || '-'}`);
            doc.text(`Endereço: ${data.endereco || '-'}`);
            doc.text(`Número: ${data.numero || '-'}`);
            doc.text(`Complemento: ${data.complemento || '-'}`);
            doc.text(`Bairro: ${data.bairro || '-'}`);
            doc.text(`Email: ${data.email || '-'}`);
            doc.text(`Celular: ${data.celular || '-'}`);
            doc.text(`Whatsapp: ${data.whatsapp || '-'}`);
            doc.text(`Escola: ${data.escola_nome || '-'}`);
            doc.text(`Turno: ${data.turno_escola || '-'}`);

            doc.moveDown();
            doc.fontSize(14).text('Dados dos Responsáveis', { underline: true });
            doc.fontSize(12).text(`Responsável: ${data.responsavel_nome || '-'}`);
            doc.text(`Nome do Pai: ${data.nome_pai || '-'}`);
            doc.text(`Celular do Pai: ${data.celular_pai || '-'}`);
            doc.text(`Nome da Mãe: ${data.nome_mae || '-'}`);
            doc.text(`Celular da Mãe: ${data.celular_mae || '-'}`);
            doc.text(`Contato de urgência: ${data.urgencia || '-'}`);
            doc.text(`Telefone urgência: ${data.telefone_urgencia || '-'}`);

            doc.moveDown();
            doc.fontSize(14).text('Núcleo', { underline: true });
            doc.fontSize(12).text(`Núcleo: ${data.nucleo || '-'}`);
            doc.text(`Turno do treino: ${data.turno_projeto || '-'}`);

            doc.moveDown();

            // Foto do aluno (se existir)
            if (data.fotoPath && fs.existsSync(data.fotoPath)) {
                try {
                    doc.addPage();
                    doc.fontSize(14).text('Foto do Aluno', { align: 'left' });
                    doc.image(data.fotoPath, { fit: [400, 400], align: 'center' });
                } catch (err) {
                    console.warn('Erro ao inserir foto no PDF:', err.message);
                }
            }

            // Assinatura do responsável (se existir)
            if (data.assinaturaRespPath && fs.existsSync(data.assinaturaRespPath)) {
                doc.addPage();
                doc.fontSize(14).text('Assinatura do Responsável', { align: 'left' });
                doc.image(data.assinaturaRespPath, { fit: [400, 200], align: 'left' });
            }

            doc.end();
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

// Config nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // trocar se precisar
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Rota health
app.get('/', (req, res) => res.send('Backend BBBE OK'));

/**
 * Rota: /api/enviar-responsavel
 * Espera JSON com campos e opcionalmente:
 *  - fotoBase64 (dataURL)
 *  - assinaturaRespBase64 (dataURL)
 *  - escolaEmail (email do diretor/escola)
 *  - escolaNome (texto da escola)
 */
app.post('/api/enviar-responsavel', async (req, res) => {
    try {
        const payload = req.body;
        // Diretórios
        const uploadsDir = path.join(__dirname, 'uploads');
        const pdfsDir = path.join(__dirname, 'pdfs');
        ensureDir(uploadsDir);
        ensureDir(pdfsDir);

        // Salvar imagens (se vierem)
        let fotoPath = null;
        if (payload.fotoBase64) {
            const fotoFilename = `${Date.now()}_foto.png`;
            fotoPath = path.join(uploadsDir, fotoFilename);
            base64ToFile(payload.fotoBase64, fotoPath);
        }

        let assinaturaRespPath = null;
        if (payload.assinaturaRespBase64) {
            const sigFilename = `${Date.now()}_assin_resp.png`;
            assinaturaRespPath = path.join(uploadsDir, sigFilename);
            base64ToFile(payload.assinaturaRespBase64, assinaturaRespPath);
        }

        // criar PDF com pdfkit
        const pdfPath = path.join(pdfsDir, `${Date.now()}_ficha.pdf`);
        await createPdfFromData({
            ...payload,
            fotoPath,
            assinaturaRespPath,
            escola_nome: payload.escolaNome || payload.escola_selecionada || ''
        }, pdfPath);

        // montar email
        const directorEmail = payload.escolaEmail || payload.escola_selecionada || '';
        if (!directorEmail) {
            // limpar arquivos se necessário
            return res.status(400).json({ success: false, message: 'Email da escola (director) é obrigatório.' });
        }

        const attachments = [
            { filename: 'Ficha_Responsavel.pdf', path: pdfPath }
        ];
        if (fotoPath) attachments.push({ filename: 'Foto_Aluno.png', path: fotoPath });
        if (assinaturaRespPath) attachments.push({ filename: 'Assinatura_Responsavel.png', path: assinaturaRespPath });

        const mailOptions = {
            from: `"${process.env.FROM_NAME || 'Projeto BBBE'}" <${process.env.EMAIL_USER}>`,
            to: directorEmail,
            cc: ASSISTANT_EMAIL,
            subject: `Ficha BBBE — ${payload.nome_aluno || 'Aluno'}`,
            text: `Olá,\n\nUma nova ficha foi enviada para a escola.\n\nAluno: ${payload.nome_aluno || '-'}\nResponsável: ${payload.responsavel_nome || '-'}\n\nLink para assinatura do Diretor: ${payload.link_diretor || (process.env.BASE_URL ? `${process.env.BASE_URL}/diretor.html?aluno=${encodeURIComponent(payload.nome_aluno || '')}` : '')}\n\nAtenciosamente,\nEquipe BBBE`,
            attachments
        };

        await transporter.sendMail(mailOptions);

        // resposta
        res.json({ success: true, message: 'Ficha enviada para a escola e cópia para o assessor.' });

        // Limpeza opcional: remover arquivos depois de algum tempo
        // setTimeout(() => fs.unlinkSync(pdfPath), 1000*60*60); // exemplo: apagar em 1h
    } catch (err) {
        console.error('Erro /enviar-responsavel:', err);
        res.status(500).json({ success: false, message: 'Erro interno ao processar ficha.' });
    }
});

/**
 * Rota: /api/enviar-diretor
 * Espera JSON com:
 *  - aluno_nome
 *  - diretor_nome
 *  - diretor_data
 *  - assinaturaBase64
 *  - (opcional) two extra images em base64 (extra1, extra2)
 *
 * Esta rota envia SOMENTE para o assessor.
 */
app.post('/api/enviar-diretor', async (req, res) => {
    try {
        const payload = req.body;
        const uploadsDir = path.join(__dirname, 'uploads');
        ensureDir(uploadsDir);

        let assinaturaPath = null;
        if (payload.assinaturaBase64) {
            const sigFilename = `${Date.now()}_assin_dir.png`;
            assinaturaPath = path.join(uploadsDir, sigFilename);
            base64ToFile(payload.assinaturaBase64, assinaturaPath);
        }

        const extraAttachments = [];
        if (payload.extra1Base64) {
            const f = path.join(uploadsDir, `${Date.now()}_extra1.png`);
            base64ToFile(payload.extra1Base64, f);
            extraAttachments.push({ path: f, filename: 'extra1.png' });
        }
        if (payload.extra2Base64) {
            const f2 = path.join(uploadsDir, `${Date.now()}_extra2.png`);
            base64ToFile(payload.extra2Base64, f2);
            extraAttachments.push({ path: f2, filename: 'extra2.png' });
        }

        const attachments = [];
        if (assinaturaPath) attachments.push({ path: assinaturaPath, filename: 'Assinatura_Diretor.png' });
        attachments.push(...extraAttachments);

        const mailOptions = {
            from: `"${process.env.FROM_NAME || 'Projeto BBBE'}" <${process.env.EMAIL_USER}>`,
            to: ASSISTANT_EMAIL,
            subject: `Assinatura do Diretor — ${payload.aluno_nome || '-'}`,
            text: `Diretor: ${payload.diretor_nome || '-'}\nData: ${payload.diretor_data || '-'}`,
            attachments
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: 'Assinatura enviada para o assessor.' });
    } catch (err) {
        console.error('Erro /enviar-diretor:', err);
        res.status(500).json({ success: false, message: 'Erro interno ao enviar assinatura.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});