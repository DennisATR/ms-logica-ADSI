const express = require('express');
const cors = require('cors');
const usb = require('usb');

const app = express();
const PORT = 4000;

// Configuración de la impresora (Reemplaza con los tuyos si son diferentes)
const VENDOR_ID = 34918;
const PRODUCT_ID = 256;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/print', (req, res) => {
  const { buffer: base64Buffer } = req.body;

  if (!base64Buffer) {
    return res.status(400).json({ error: 'Falta el buffer de impresión' });
  }

  const printData = Buffer.from(base64Buffer, 'base64');

  const device = usb.findByIds(VENDOR_ID, PRODUCT_ID);
  
  if (!device) {
    return res.status(500).json({ error: 'Impresora no encontrada en el USB local' });
  }

  try {
    device.open();
    const iface = device.interfaces[0];
    
    // En Windows a veces es necesario hacer detachKernelDriver
    if (iface.isKernelDriverActive && iface.isKernelDriverActive()) {
      try {
        iface.detachKernelDriver();
      } catch (e) {
        console.error('No se pudo desvincular el driver del kernel:', e);
      }
    }

    iface.claim();

    const endpoint = iface.endpoints.find(
      (e) => e.direction === 'out' && e.transferType === 2
    );

    if (!endpoint) {
      iface.release(true, () => device.close());
      return res.status(500).json({ error: 'Endpoint OUT no encontrado en la impresora' });
    }

    endpoint.transfer(printData, (err) => {
      iface.release(true, () => device.close());
      if (err) {
        console.error('Error al transferir a la impresora:', err);
        return res.status(500).json({ error: 'Error de impresión', detalle: err.message });
      } else {
        console.log('✅ Documento impreso exitosamente');
        return res.json({ success: true, message: 'Impresión enviada correctamente' });
      }
    });

  } catch (e) {
    try { device.close(); } catch (err) {}
    console.error('Error general de impresión:', e);
    return res.status(500).json({ error: 'Excepción al intentar imprimir', detalle: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`======================================`);
  console.log(`Agente de Impresión Local iniciado`);
  console.log(`Escuchando peticiones en: http://localhost:${PORT}`);
  console.log(`Asegúrate de que la impresora esté conectada y encendida.`);
  console.log(`======================================`);
});
