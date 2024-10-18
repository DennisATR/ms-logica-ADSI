import {BindingScope, injectable} from '@loopback/core';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import {Zapato} from '../models';

@injectable({scope: BindingScope.TRANSIENT})
export class StickerService {
  constructor() {}

  /**
   * Genera un sticker en formato PDF para un zapato específico.
   * @param zapato - El zapato para el cual se generará el sticker.
   * @returns La ruta donde se ha guardado el archivo PDF.
   */
  generarSticker(zapato: Zapato): string {
    // Define la ruta donde se guardará el sticker
    const filePath = `./stickers/sticker_${zapato.getId}.pdf`;

    // Crea un nuevo documento PDF
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    // Añade información al sticker
    doc.fontSize(12).text(`Nombre del Local: hyt`);
    doc.text(`Producto: Zapato`);
    doc.text(`Modelo: ${zapato.Descripcion}`);
    doc.text(`Código de Barras: ${zapato.id}`);
    doc.text(`Precio: $${zapato.PrecioVentaMax}`);
    doc.text(`Talla: ${zapato.Talla}`);
    doc.text(`Color: ${zapato.Color}`);

    // Finaliza la creación del PDF
    doc.end();

    // Retorna la ruta donde se guardó el PDF
    return filePath;
  }
}
