const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

// Rota teste
app.get("/", (req, res) => {
    res.send("Backend funcionando!");
});

// Porta
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});