import express from "express";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "formulario.html"));
});

app.post("/enviar", async (req, res) => {
    const { empresa, tipo_acesso, responsavel, necessidade, urgencia } = req.body;

    const doc = new PDFDocument();
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
        const pdfData = Buffer.concat(buffers);

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_DESTINO,
                subject: "Novo Formulário de Acesso",
                text: "Segue em anexo o PDF com os dados do formulário.",
                attachments: [
                    {
                        filename: "acesso.pdf",
                        content: pdfData,
                    },
                ],
            });

            res.status(200).send("Enviado");
        } catch (err) {
            console.error(err);
            res.status(500).send("Erro ao enviar e-mail.");
        }
    });

    const logoPath = path.join(__dirname, "logo.jpg");
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 40, { width: 100 });
    }

    doc.fontSize(18).text("Formulário de Acesso", 50, 140);
    doc.moveDown();
    doc.fontSize(12).text(`Empresa: ${empresa}`);
    doc.text(`Tipo de Acesso: ${tipo_acesso}`);
    doc.text(`Responsável: ${responsavel}`);
    doc.text(`Urgência: ${urgencia}`);
    doc.moveDown();
    doc.text(`Necessidade: ${necessidade}`);
    doc.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Rodando na porta", PORT));