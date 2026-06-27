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
  ) {}

  async printStiker(zapatoId: string): Promise<void> {
    const zapato = await this.zapatoRepository.findById(zapatoId);
    
    const local = await this.infolocalRepository.findOne({
      order: ['id DESC'],
    });

    const buffer = this.buildTsplBuffer(
      zapato.id ?? '',
      local?.Nombre ?? 'LOCAL',
      zapato.Descripcion ?? ''
    );

    return new Promise((resolve, reject) => {
      // Buscar la impresora USB por Vendor y Product ID
      // Si la impresora 3nStar tiene otros IDs, se deben actualizar VENDOR_ID y PRODUCT_ID arriba.
      // También se podría iterar por usb.getDeviceList() y buscar por interfaz de impresora.
      let device = usb.findByIds(VENDOR_ID, PRODUCT_ID);
      
      // Intentar buscar una impresora genérica si no la encuentra por ID
      if (!device) {
          const devices = usb.getDeviceList();
          for (const d of devices) {
              if (d.deviceDescriptor.bDeviceClass === 7) { // 7 es la clase de Impresora
                  device = d;
                  break;
              }
          }
      }

      if (!device) return reject(new Error('Impresora 3nStar no encontrada. Verifique la conexión USB y los IDs.'));

      try {
        device.open();
        
        // Buscar la interfaz que corresponda a la impresora
        let printerIface = device.interfaces.find((i: any) => i.descriptor.bInterfaceClass === 7);
        if (!printerIface) {
            printerIface = device.interfaces[0]; // Usar la primera por defecto si no declara clase 7
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
        try { device.close(); } catch { }
        reject(e);
      }
    });
  }

  // Genera el buffer de comandos TSPL para la impresora 3nStar 4barcode 4b-2074b
  // Tamaño del sticker: 50x25 mm
  private buildTsplBuffer(codigo: string, almacen: string, descripcion: string): Buffer {
    // Comandos TSPL
    const tspl = [
      'SIZE 50 mm,25 mm',
      'GAP 2 mm,0 mm',
      'DIRECTION 1',
      'CLS',
      // TEXT x,y,"font",rotation,x-multiplier,y-multiplier,"content"
      `TEXT 20,20,"3",0,1,1,"${almacen.substring(0, 30)}"`, // Fuente 3 para nombre del almacén
      `TEXT 20,60,"2",0,1,1,"${descripcion.substring(0, 40)}"`, // Fuente 2 para descripción
      // BARCODE x,y,"code type",height,human readable,rotation,narrow,wide,"content"
      // "128" = Code 128, height = 60 dots, human readable = 1 (abajo)
      `BARCODE 20,100,"128",60,1,0,2,2,"${codigo}"`,
      'PRINT 1,1',
      ''
    ].join('\r\n'); // Los comandos TSPL deben estar separados por CRLF

    return Buffer.from(tspl, 'utf8');
  }
}
