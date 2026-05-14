const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  },
});

client.on('qr', (qr) => {
  console.log('Escanea el QR con WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('WhatsApp conectado y listo.');
});

client.on('auth_failure', (msg) => {
  console.error('Error de autenticación:', msg);
});

client.on('disconnected', (reason) => {
  console.warn('Cliente desconectado:', reason);
  client.initialize();
});

client.initialize();

app.post('/send', async (req, res) => {
  const { phone, message, secret } = req.body;

  if (!secret || secret !== SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!phone || !message) {
    return res.status(400).json({ error: 'phone y message son requeridos' });
  }

  const chatId = `${phone}@c.us`;

  try {
    await client.sendMessage(chatId, message);
    res.json({ success: true, to: phone });
  } catch (err) {
    console.error('Error enviando mensaje:', err);
    res.status(500).json({ error: 'Error al enviar mensaje', details: err.message });
  }
});

app.get('/status', (req, res) => {
  const state = client.info ? 'connected' : 'disconnected';
  res.json({ status: state });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
