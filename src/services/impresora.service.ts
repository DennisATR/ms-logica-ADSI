import {injectable} from '@loopback/core';

const usb = require('usb');

const VENDOR_ID = 34918;
const PRODUCT_ID = 256;

@injectable()
export class ImpresoraService {

  async printFactura(factura: {id?: number; cliente?: string; total?: number}): Promise<void> {
    return new Promise((resolve, reject) => {
      const device = usb.findByIds(VENDOR_ID, PRODUCT_ID);

      if (!device) {
        console.warn('Impresora no encontrada, se omite impresión.');
        return resolve(); // No bloquear el flujo si no hay impresora
      }

      try {
        device.open();
        const iface = device.interfaces[0];
        iface.claim();

        const endpoint = iface.endpoints.find(
          (ep: any) => ep.direction === 'out' && ep.transferType === 2,
        );

        if (!endpoint) {
          iface.release(true, () => device.close());
          return reject(new Error('No se encontró endpoint de salida'));
        }

        const contenido = this.buildTicket(factura);
        const buffer = this.buildEscPosBuffer(contenido);

        endpoint.transfer(buffer, (error: any) => {
          iface.release(true, () => device.close());
          if (error) {
            reject(new Error(`Error al imprimir: ${error.message}`));
          } else {
            resolve();
          }
        });

      } catch (err) {
        try {device.close();} catch (_) { }
        reject(err);
      }
    });
  }

  private buildTicket(factura: {id?: number; cliente?: string; total?: number}): string {
    const linea = '================================\n';
    return (
      linea +
      '        MI EMPRESA S.A.S\n' +
      linea +
      `Factura #: ${factura.id ?? 'N/A'}\n` +
      `Cliente:   ${factura.cliente ?? 'Consumidor final'}\n` +
      `Total:     $${factura.total ?? 0}\n` +
      linea +
      '     Gracias por su compra!\n'
    );
  }

  private buildEscPosBuffer(texto: string): Buffer {
    return Buffer.concat([
      Buffer.from([0x1B, 0x40]),          // ESC @ - Inicializar
      Buffer.from([0x1B, 0x21, 0x00]),    // Modo texto normal
      Buffer.from(texto, 'utf-8') as any,
      Buffer.from([0x1D, 0x56, 0x41, 0x10]), // Corte parcial
    ]);
  }
}
