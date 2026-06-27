import {injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  FacturaRepository,
  InfolocalRepository,
  VentaRepository,
} from '../repositories';

const usb = require('usb');

const VENDOR_ID = 34918;
const PRODUCT_ID = 256;

// ===== ESC/POS COMMANDS =====
const INIT = Buffer.from([0x1B, 0x40]);
const CENTER = Buffer.from([0x1B, 0x61, 0x01]);
const LEFT = Buffer.from([0x1B, 0x61, 0x00]);
const BOLD_ON = Buffer.from([0x1B, 0x45, 0x01]);
const BOLD_OFF = Buffer.from([0x1B, 0x45, 0x00]);
const DOUBLE_SIZE = Buffer.from([0x1D, 0x21, 0x11]);
const NORMAL_SIZE = Buffer.from([0x1D, 0x21, 0x00]);
const CUT = Buffer.from([0x1D, 0x56, 0x41, 0x10]);
const CASH_DRAWER = Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]);
const LINE = Buffer.from('--------------------------------\n');

@injectable()
export class ImpresoraService {
  constructor(
    @repository(FacturaRepository)
    public facturaRepository: FacturaRepository,
    @repository(InfolocalRepository)
    public infolocalRepository: InfolocalRepository,
    @repository(VentaRepository)
    public ventaRepository: VentaRepository,
  ) { }

  async printFactura(factura: {id: number}): Promise<void> {
    const buffer = await this.buildFacturaBuffer(factura.id);

    return new Promise((resolve, reject) => {
      const device = usb.findByIds(VENDOR_ID, PRODUCT_ID);
      if (!device) return resolve();

      try {
        device.open();
        const iface = device.interfaces[0];
        iface.claim();

        const endpoint = iface.endpoints.find(
          (e: any) => e.direction === 'out' && e.transferType === 2,
        );

        if (!endpoint) throw new Error('Endpoint OUT no encontrado');

        endpoint.transfer(buffer, (err: any) => {
          iface.release(true, () => device.close());
          if (err) reject(err);
          else resolve();
        });
      } catch (e) {
        try {device.close();} catch { }
        reject(e);
      }
    });
  }

  // ===== FACTURA =====
  public async buildFacturaBuffer(facturaId: number): Promise<Buffer> {
    const factura = await this.facturaRepository.findById(facturaId, {
      include: [{relation: 'cliente'}, {relation: 'vendedor'}, {relation: 'pagoFacturas', scope: {include: [{relation: 'metodoPago'}]}}],
    }) as any;

    const ventas = await this.ventaRepository.find({
      where: {facturaId},
      include: [{relation: 'zapato'}],
    }) as any;

    const local = await this.infolocalRepository.findOne({
      order: ['id DESC'],
    });

    const buffers: Buffer[] = [];

    // ===== HEADER =====
    buffers.push(
      INIT,
      CENTER,
      DOUBLE_SIZE,
      BOLD_ON,
      Buffer.from(`${local?.Nombre ?? 'LOCAL'}\n`),
      BOLD_OFF,
      NORMAL_SIZE,
      Buffer.from(`NIT: ${local?.NIT ?? 'N/A'}\n`),
      Buffer.from(`Dir: ${local?.Direccion ?? 'N/A'}\n`),
      Buffer.from(`Tel: ${local?.Telefono ?? 'N/A'}\n`),
      LINE,
      LEFT,
    );

    // ===== INFO FACTURA =====
    const pagos = factura.pagoFacturas ?? [];
    const abono = pagos.reduce((acc: number, pago: any) => acc + (pago.Monto ?? 0), 0);

    buffers.push(
      Buffer.from(`Factura #: ${factura.id}\n`),
      Buffer.from(`Fecha: ${this.formatDate(factura.Fecha)}\n`),
      Buffer.from(`Cliente: ${(factura as any).cliente?.Nombre ?? 'Consumidor Final'}\n`),
      Buffer.from(`Vendedor: ${factura.vendedor?.Nombre ?? 'N/A'}\n`),
      LINE,
    );

    if (pagos.length === 0) {
      buffers.push(Buffer.from('Pagos: Sin registros\n'));
    } else {
      buffers.push(Buffer.from('Pagos:\n'));
      pagos.forEach((pago: any) => {
        buffers.push(
          Buffer.from(`- ${pago.metodoPago?.Nombre ?? 'N/A'}: ${this.money(pago.Monto ?? 0)}\n`),
        );
      });
    }

    buffers.push(LINE);

    // ===== DETALLE =====
    buffers.push(BOLD_ON, Buffer.from('DETALLE\n'), BOLD_OFF);

    ventas.forEach((v: any) => {
      const desc = (v.zapato?.Descripcion ?? 'ITEM').substring(0, 16);
      buffers.push(
        Buffer.from(
          `${this.pad(desc, 16)}${this.pad(String(v.Cantidad), 4)}${this.pad(
            this.money(v.Precio),
            6,
          )}${this.money(v.Cantidad * v.Precio)}\n`,
        ),
      );
    });

    buffers.push(LINE);

    // ===== TOTALES =====
    buffers.push(
      BOLD_ON,
      Buffer.from(`TOTAL: ${this.money(factura.Total)}\n`),
      BOLD_OFF,
      Buffer.from(`ABONO: ${this.money(abono)}\n`),
      Buffer.from(`SALDO: ${this.money(factura.Total - abono)}\n`),
      LINE,
    );

    // ===== FOOTER =====
    buffers.push(
      CENTER,
      Buffer.from(local?.Mensaje ?? '¡Gracias por su compra!\n'),
      Buffer.from('\n'),
      LEFT,
      Buffer.from('Desarrollado por ADSI\n'),
      Buffer.from('adsi.notificaciones@gmail.com\n'),
      CUT,
      CASH_DRAWER,
    );

    return Buffer.concat(buffers as Uint8Array[]);
  }

  // ===== HELPERS =====
  private money(v: number): string {
    return v.toFixed(2);
  }

  private pad(t: string, l: number): string {
    return t.padEnd(l).substring(0, l);
  }

  private formatDate(d: any): string {
    const date = new Date(d);
    // Usar métodos UTC para mostrar la fecha exacta de la BD sin conversión de zona horaria
    const dia = date.getUTCDate().toString().padStart(2, '0');
    const mes = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const anio = date.getUTCFullYear();
    const hora = date.getUTCHours().toString().padStart(2, '0');
    const minutos = date.getUTCMinutes().toString().padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hora}:${minutos}`;
  }
}
