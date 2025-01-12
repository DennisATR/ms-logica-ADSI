import {BindingScope, injectable} from '@loopback/core';
import {exec} from 'child_process';
import {Document, Packer, Paragraph, TextRun} from "docx";
import * as fs from "fs";
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
    const filePath = `./stickers/sticker_${zapato.getId()}.docx`;

    // Asegúrate de que la carpeta exista
    if (!fs.existsSync('./stickers')) {
      fs.mkdirSync('./stickers');
    }

    // Crear un documento de Word con orientación horizontal (rotada)
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { width: 652, height: 1360 }, // Tamaño en twips (4.8 cm x 2.3 cm), pero rotado
              margin: { top: 0, bottom: 0, left: 0, right: 0 }, // Sin márgenes
            },
          },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Nombre del Local: hyt`,
                  size: 16, // Tamaño pequeño (8 pt)
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun(`Producto: Zapato`),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun(`Modelo: ${zapato.Descripcion}`),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun(`Código de Barras: ${zapato.id}`),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun(`Precio: $${zapato.PrecioVentaMax}`),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun(`Talla: ${zapato.Talla}`),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun(`Color: ${zapato.Color}`),
              ],
            }),
          ],
        },
      ],
    });

    // Guardar el documento en el sistema de archivos
    Packer.toBuffer(doc).then((buffer) => {
      fs.writeFileSync(filePath, buffer);
    });

    // Retorna la ruta donde se guardó el documento
    return filePath;
  }




  /**
   * Elimina un sticker en formato PDF.
   * @param filePath - La ruta donde se encuentra el archivo PDF.
   */
  eliminarSticker(filePath: string): void {
    fs.unlinkSync(filePath);
  }

  /**
   * Imprime el sticker generado en formato PDF.
   * @param filePath - La ruta del archivo PDF del sticker.
   */
  imprimirSticker(filePath: string): void {
    // Asegúrate de usar la impresora predeterminada o ajusta el nombre de la impresora si es necesario
    const command = `start /min acrord32.exe /t "${filePath}" "4BARCODE"`;
    exec(command, (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.error(`Error al imprimir sticker: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Error al imprimir sticker: ${stderr}`);
        return;
      }
      console.log(`Sticker impreso correctamente`);
    });
  }
}

