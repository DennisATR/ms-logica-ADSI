import {BindingScope, injectable} from '@loopback/core';
import escpos from 'escpos';

@injectable({scope: BindingScope.TRANSIENT})
export class ImpresoraService {
  private device: escpos.USB;
  private printer: escpos.Printer;

  constructor() {
    try {
      // Crear una instancia de la impresora USB
      this.device = new escpos.USB();
      console.log("Impresora configurada correctamente");
      console.log(this.device);
      this.printer = new escpos.Printer(this.device);
    } catch (err) {
      console.error("Error al configurar la impresora:", err);
    }
  }

  /*
   * Método para imprimir la factura
   */
  async imprimirFactura(factura: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.device) {
        reject("No se configuró la impresora correctamente");
        return;
      }

      this.device.open((err) => {
        if (err) {
          console.error(`Error al abrir la impresora: ${err.message}`);
          reject(`Error al abrir la impresora: ${err.message}`);
          return;
        }

        this.printer
          .align("CT") // Centrar
          .text("======== FACTURA ========")
          .newLine()
          .text('Cliente: YO')
          .align("LT") // Alinear a la izquierda
          .newLine()
          .cut() // Cortar papel
          .close(() => resolve());
      });
    });
  }
}
