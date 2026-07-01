import {injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {InfolocalRepository, ZapatoRepository} from '../repositories';

const usb = require('usb');

// Identificadores para la impresora 3nStar 4b-2074b
const VENDOR_ID = 0x2D84;
const PRODUCT_ID = 0x7589;

@injectable()
export class StikerService {
  constructor(
    @repository(ZapatoRepository)
    public zapatoRepository: ZapatoRepository,
    @repository(InfolocalRepository)
    public infolocalRepository: InfolocalRepository,
  ) { }

  async printStiker(zapatoId: string): Promise<void> {
    const zapato = await this.zapatoRepository.findById(zapatoId);

    const local = await this.infolocalRepository.findOne({
      order: ['id DESC'],
    });

    const tsplSticker = this.buildTsplString(
      zapato.id ?? '',
      local?.Nombre ?? 'LOCAL',
      zapato.Descripcion ?? '',
      zapato.Color ?? '',
      zapato.Talla ?? 0,
      zapato.PrecioVentaMax ?? 0,
    );

    const cantidad = zapato.Cantidad ?? 1;
    const comandos: string[] = [];
    for (let c = 0; c < cantidad; c++) {
      comandos.push(tsplSticker);
    }

    const buffer = Buffer.from(comandos.join(''), 'utf8');
    return this.enviarBufferImpresora(buffer);
  }

  /**
   * Imprime stickers para todos los zapatos de una serie (lista de IDs).
   * Cada sticker se imprime tantas veces como indique la cantidad del zapato.
   * Envía todo en un solo buffer USB para evitar conflictos de reapertura del puerto.
   */
  async printStikerSerie(zapatoIds: string[]): Promise<void> {
    const local = await this.infolocalRepository.findOne({
      order: ['id DESC'],
    });
    const almacen = local?.Nombre ?? 'LOCAL';

    const comandos: string[] = [];

    for (const zapatoId of zapatoIds) {
      const zapato = await this.zapatoRepository.findById(zapatoId);
      const tsplSticker = this.buildTsplString(
        zapato.id ?? '',
        almacen,
        zapato.Descripcion ?? '',
        zapato.Color ?? '',
        zapato.Talla ?? 0,
        zapato.PrecioVentaMax ?? 0,
      );
      const cantidad = zapato.Cantidad ?? 1;
      for (let c = 0; c < cantidad; c++) {
        comandos.push(tsplSticker);
      }
    }

    if (comandos.length > 0) {
      const buffer = Buffer.from(comandos.join(''), 'utf8');
      await this.enviarBufferImpresora(buffer);
    }
  }

  /**
   * Formatea el texto de descripción priorizando el número si existe en el nombre.
   * Si hay un número en la descripción:
   *   - El nombre se recorta a máximo 6 caracteres
   *   - Se añade 1 letra adicional (inicial del resto del nombre o espacio)
   *   - Se concatena los primeros dígitos del número encontrado
   * Si no hay número, se usa la descripción normal hasta 22 chars.
   *
   * Ejemplo: "Bota Casual 2074" → "Bota C 2074"
   */
  private formatDescripcion(descripcion: string, maxChars: number): string {
    // La descripcion es un texto libre del producto (ej. "Hurtado Running").
    // Solo se convierte a mayusculas y se trunca al limite indicado.
    // La logica anterior de separar numeros ya no aplica: el codigo interno
    // del zapato se genera de forma independiente en zapato.controller.ts.
    return descripcion.toUpperCase().substring(0, maxChars);
  }

  // Genera el texto de comandos TSPL para la impresora 3nStar 4barcode 4b-2074b
  // Tamaño del sticker: 50x25 mm
  // Layout:
  //   Línea 1: Nombre del almacén
  //   Línea 2: Descripción formateada  Co/lo  T[talla]
  //   Fila 3:  [Código de barras (izq)]  [Precio $xx (der)]
  // Formatea el precio con signo de pesos y separadores de miles
  private formatPrecio(precio: number): string {
    return '$' + precio.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Genera el texto de comandos TSPL para la impresora 3nStar 4barcode 4b-2074b
  // Tamaño del sticker: 50x25 mm (~400x200 dots a 8 dots/mm)
  // Layout profesional proporcional sin números mágicos
  private buildTsplString(
    codigo: string,
    almacen: string,
    descripcion: string,
    color: string,
    talla: number,
    precio: number,
  ): string {
    // ---- CONSTANTES FÍSICAS DEL STICKER ----
    // El área imprimible real de la impresora es ligeramente menor al tamaño físico.
    // Por eso usamos un CONTENT_RIGHT seguro en lugar del borde absoluto LABEL_WIDTH.
    const LABEL_WIDTH = 400;    // Ancho total en dots (50 mm x 8 dots/mm)
    const MARGIN_LEFT = 10;     // Margen izquierdo fijo
    const MARGIN_TOP = 12;      // Margen superior

    // Borde derecho seguro del area imprimible: dejamos 20 dots de margen real
    // para que ningun elemento quede cortado por la impresora.
    const CONTENT_RIGHT = 355;  // = LABEL_WIDTH - 20 dots de margen real

    // ---- DIVISION EN DOS ZONAS HORIZONTALES ----
    // Zona izquierda (barcode + descripcion): MARGIN_LEFT ... ZONE_SPLIT
    // Zona derecha  (color/talla + precio):   ZONE_SPLIT  ... CONTENT_RIGHT
    //
    // Damos ~63% al barcode y ~37% al precio/detalle:
    //   ZONE_SPLIT aprox 10 + 0.63 * (380 - 10) = 10 + 233 = 243
    const ZONE_SPLIT = 248;     // inicio de la zona derecha en dots

    // ---- CONSTANTES DE FUENTES TSPL ----
    const FONT2_WIDTH = 12;     // Ancho de caracter de la Fuente "2" (12x20 dots)
    const FONT2_HEIGHT = 20;    // Alto de caracter de la Fuente "2"
    const FONT3_WIDTH = 16;     // Ancho de caracter de la Fuente "3" (16x24 dots)
    const FONT3_HEIGHT = 24;    // Alto de caracter de la Fuente "3"

    // ---- LINEA 1: NOMBRE DEL ALMACEN (Centrado dentro del area imprimible) ----
    const storeName = almacen.substring(0, 30);
    // Centrado respecto a CONTENT_RIGHT para no salirse del area segura
    const storeX = Math.max(
      MARGIN_LEFT,
      Math.floor((CONTENT_RIGHT - storeName.length * FONT3_WIDTH) / 2)
    );
    const storeY = MARGIN_TOP;

    // ---- LINEA 2: DETALLE (Descripcion | Color y Talla) ----
    // Formatear color: dividir por barras, comas, guiones o espacios multiples.
    // Filtrar conectores vacios (ej. "Y", "CON"), tomar maximo 2 colores
    // y extraer exactamente las 2 primeras letras de cada uno -> "BL/RO".
    const STOP_COLORS = new Set(['Y', 'CON', 'DE']);
    const coloresRaw = color
      .split(/[,\/\-]+|\s+/)
      .map(c => c.trim())
      .filter(c => c.length > 0 && !STOP_COLORS.has(c.toUpperCase()));
    const colorAbrev = coloresRaw
      .slice(0, 2)                         // maximo 2 colores; el tercero se omite
      .map(c => c.substring(0, 2).toUpperCase())
      .join('/');

    // Formatear talla: solo el numero, sin "T" ni "Talla"
    const tallaStr = talla.toString();
    const colorTalla = colorAbrev ? `${colorAbrev} ${tallaStr}` : tallaStr;

    // Color y Talla se ubican en la zona derecha, alineados a CONTENT_RIGHT
    const colorTallaWidth = colorTalla.length * FONT2_WIDTH;
    const colorTallaX = CONTENT_RIGHT - colorTallaWidth;
    const detailY = storeY + FONT3_HEIGHT + 10;

    // Descripcion en zona izquierda: truncar antes de ZONE_SPLIT con 1 caracter de separacion
    const maxDescWidth = ZONE_SPLIT - MARGIN_LEFT - FONT2_WIDTH;
    const maxDescChars = Math.floor(maxDescWidth / FONT2_WIDTH);
    // Maximo 17 caracteres (contando espacios) segun requerimiento
    const limitDescChars = Math.min(17, maxDescChars);
    const descFormateada = this.formatDescripcion(descripcion, limitDescChars);

    // ---- LINEA 3: CODIGO DE BARRAS & PRECIO ----
    // Barcode ocupa desde MARGIN_LEFT hasta ZONE_SPLIT
    const barcodeX = MARGIN_LEFT;
    const barcodeY = detailY + FONT2_HEIGHT + 10;
    const barcodeHeight = 70;

    // Formatear precio con separador de miles (ej. $158.000)
    const precioStr = this.formatPrecio(precio);

    // Fuente "3" con multiplicador y=2 (16x48 dots) para maxima visibilidad
    const precioCharWidth = 16;
    const precioCharHeight = 48; // 24 * 2

    // Precio alineado a CONTENT_RIGHT dentro de la zona derecha (ZONE_SPLIT...CONTENT_RIGHT)
    const precioX = CONTENT_RIGHT - (precioStr.length * precioCharWidth);

    // Centrar precio verticalmente respecto a las barras del codigo de barras
    const precioY = Math.floor(barcodeY + (barcodeHeight / 2) - (precioCharHeight / 2));

    // Texto legible debajo del barcode: se imprime como TEXT separado
    // para poder controlar el tamano de fuente independientemente.
    // Fuente "2" con y_mult=1 = 12x20 dots. Para agrandar: cambiar "2" por "3" (16x24)
    // o aumentar el y_mult de 1 a 2 (hace las letras mas altas).
    // *** AJUSTE DE TAMANO DEL TEXTO DEL CODIGO DE BARRAS: linea BARCODE_TEXT_Y y la fuente abajo ***
    const BARCODE_TEXT_FONT = '2';        // Fuente del texto legible: "1"=8px, "2"=12px, "3"=16px
    const BARCODE_TEXT_Y_MULT = 1;        // Multiplicador de alto: 1=normal, 2=doble
    const BARCODE_TEXT_Y = barcodeY + barcodeHeight + 4; // 4 dots de separacion tras las barras

    // Retornar comandos TSPL (Separados por CRLF)
    return [
      'SIZE 50 mm,25 mm',
      'GAP 2 mm,0 mm',
      'DIRECTION 1',
      'CLS',
      // Linea 1: Nombre del almacen centrado en el area imprimible segura
      `TEXT ${storeX},${storeY},"3",0,1,1,"${storeName}"`,
      // Linea 2: Descripcion en zona izquierda (max 17 chars)
      `TEXT ${MARGIN_LEFT},${detailY},"2",0,1,1,"${descFormateada}"`,
      // Linea 2: Color y Talla alineados a CONTENT_RIGHT en zona derecha
      `TEXT ${colorTallaX},${detailY},"2",0,1,1,"${colorTalla}"`,
      // Linea 3: Barcode sin texto integrado (human=0); el texto se imprime aparte
      `BARCODE ${barcodeX},${barcodeY},"128",${barcodeHeight},0,0,1,1,"${codigo}"`,
      // Linea 3: Texto legible del codigo de barras con fuente ajustable
      `TEXT ${MARGIN_LEFT},${BARCODE_TEXT_Y},"${BARCODE_TEXT_FONT}",0,1,${BARCODE_TEXT_Y_MULT},"${codigo}"`,
      // Linea 3: Precio destacado en zona derecha, alineado a CONTENT_RIGHT
      `TEXT ${precioX},${precioY},"3",0,1,2,"${precioStr}"`,
      'PRINT 1,1',
      ''
    ].join('\r\n');
  }

  // Método interno reutilizable para enviar un buffer a la impresora USB
  private enviarBufferImpresora(buffer: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      let device = usb.findByIds(VENDOR_ID, PRODUCT_ID);

      if (!device) {
        const devices = usb.getDeviceList();
        for (const d of devices) {
          if (d.deviceDescriptor.bDeviceClass === 7) {
            device = d;
            break;
          }
        }
      }

      if (!device) return reject(new Error('Impresora 3nStar no encontrada. Verifique la conexión USB y los IDs.'));

      try {
        device.open();

        let printerIface = device.interfaces.find((i: any) => i.descriptor.bInterfaceClass === 7);
        if (!printerIface) {
          printerIface = device.interfaces[0];
        }

        printerIface.claim();

        const endpoint = printerIface.endpoints.find(
          (e: any) => e.direction === 'out' && e.transferType === 2,
        );

        if (!endpoint) throw new Error('Endpoint OUT no encontrado en la impresora');

        endpoint.transfer(buffer, (err: any) => {
          printerIface.release(true, () => device.close());
          if (err) reject(err);
          else resolve();
        });
      } catch (e) {
        try {device.close();} catch { }
        reject(e);
      }
    });
  }
}
