import {injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  CierreCajaRepository,
  CreditoRepository,
  DevolucionRepository,
  EntregaRepository,
  FacturaRepository,
  GastosRepository,
  InfolocalRepository,
  PagoFacturaRepository,
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
    @repository(CierreCajaRepository)
    public cierreCajaRepository: CierreCajaRepository,
    @repository(CreditoRepository)
    public creditoRepository: CreditoRepository,
    @repository(GastosRepository)
    public gastosRepository: GastosRepository,
    @repository(EntregaRepository)
    public entregaRepository: EntregaRepository,
    @repository(PagoFacturaRepository)
    public pagoFacturaRepository: PagoFacturaRepository,
    @repository(DevolucionRepository)
    public devolucionRepository: DevolucionRepository,
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
    const metodoPagoNombre = (pagos[0]?.metodoPago?.Nombre ?? '').toLowerCase();
    const esCredito = metodoPagoNombre.includes('credito') || metodoPagoNombre.includes('crédito');

    buffers.push(BOLD_ON, Buffer.from(`TOTAL: ${this.money(factura.Total)}\n`), BOLD_OFF);

    if (esCredito) {
      // Crédito: abono acumulado, saldo pendiente + lo recibido/cambio de este pago
      buffers.push(
        Buffer.from(`ABONO:    ${this.money(abono)}\n`),
        Buffer.from(`SALDO:    ${this.money(factura.Total - abono)}\n`),
      );
      const primerPago = pagos[0];
      if (primerPago && (primerPago.MontoRecibido ?? 0) > 0) {
        buffers.push(
          Buffer.from(`RECIBIDO: ${this.money(primerPago.MontoRecibido)}\n`),
          Buffer.from(`CAMBIO:   ${this.money(primerPago.Cambio ?? 0)}\n`),
        );
      }
    } else {
      // Contado/Efectivo/Transferencia: solo recibido y cambio si aplica
      const primerPago = pagos[0];
      const montoRecibido = primerPago?.MontoRecibido ?? 0;
      const cambio = primerPago?.Cambio ?? 0;
      if (montoRecibido > 0) {
        buffers.push(
          Buffer.from(`RECIBIDO: ${this.money(montoRecibido)}\n`),
          Buffer.from(`CAMBIO:   ${this.money(cambio)}\n`),
        );
      }
    }

    buffers.push(LINE);



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

  // ===== CIERRE DE CAJA =====

  async printCierreCaja(cierre: {id: number}): Promise<void> {
    const buffer = await this.buildCierreCajaBuffer(cierre.id);

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
        try { device.close(); } catch { }
        reject(e);
      }
    });
  }

  public async buildCierreCajaBuffer(cierreId: number): Promise<Buffer> {
    const cierre = await this.cierreCajaRepository.findById(cierreId);
    const local = await this.infolocalRepository.findOne({order: ['id DESC']});

    let soloFecha = '';
    const fechaAperturaRaw: any = cierre.FechaHoraApertura;
    
    try {
      const d = fechaAperturaRaw ? new Date(fechaAperturaRaw) : new Date();
      if (!Number.isNaN(d.getTime())) {
        // Obtenemos la fecha en la zona horaria de Colombia
        const bogotaDate = new Date(d.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
        const yyyy = bogotaDate.getFullYear();
        const mm = String(bogotaDate.getMonth() + 1).padStart(2, '0');
        const dd = String(bogotaDate.getDate()).padStart(2, '0');
        soloFecha = `${yyyy}-${mm}-${dd}`;
      } else {
        throw new Error('Fecha inválida');
      }
    } catch (e) {
      // Fallback a hoy en caso de que todo falle
      const bogotaDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
      const yyyy = bogotaDate.getFullYear();
      const mm = String(bogotaDate.getMonth() + 1).padStart(2, '0');
      const dd = String(bogotaDate.getDate()).padStart(2, '0');
      soloFecha = `${yyyy}-${mm}-${dd}`;
    }

    console.log('>>> [DEBUG IMPRESORA] cierre.FechaHoraApertura:', fechaAperturaRaw);
    console.log('>>> [DEBUG IMPRESORA] soloFecha calculado:', soloFecha);

    // --- Ventas del día (resumen por zapato) ---
    const facturasDelDia = await this.facturaRepository.find({
      where: {Fecha: {like: `${soloFecha}%`}},
      fields: {id: true, Total: true},
    });
    
    console.log('>>> [DEBUG IMPRESORA] facturasDelDia count:', facturasDelDia.length);
    const facturaIds = facturasDelDia
      .map(f => f.id)
      .filter((id): id is number => typeof id === 'number');

    const ventas = facturaIds.length > 0
      ? await this.ventaRepository.find({
          where: {facturaId: {inq: facturaIds}},
          include: [{relation: 'zapato'}],
        }) as any[]
      : [];

    const resumenVentasMap = new Map<string, {descripcion: string; cantidad: number; valor: number}>();
    for (const v of ventas) {
      const desc = (v.zapato?.Descripcion ?? 'ITEM').substring(0, 14);
      const clave = v.zapatoId?.toString() ?? desc;
      const acc = resumenVentasMap.get(clave) ?? {descripcion: desc, cantidad: 0, valor: 0};
      acc.cantidad += v.Cantidad;
      acc.valor += v.Cantidad * v.Precio;
      resumenVentasMap.set(clave, acc);
    }
    const resumenVentas = Array.from(resumenVentasMap.values());
    const totalVentas = resumenVentas.reduce((s, i) => s + i.valor, 0);

    // --- Gastos del día ---
    const gastosDelDia = await this.gastosRepository.find({
      where: {Fecha: {like: `${soloFecha}%`}},
    }) as any[];
    const totalGastos = gastosDelDia.reduce((s, g) => s + (g.Valor ?? 0), 0);

    // --- Entregas del día ---
    const entregasDelDia = await this.entregaRepository.find({
      where: {Fecha: {like: `${soloFecha}%`}},
    }) as any[];
    const totalEntregas = entregasDelDia.reduce((s, e) => s + (e.Cobro ?? 0), 0);

    // --- Devoluciones del día ---
    const devolucionesDelDia = await this.devolucionRepository.find({
      where: {Fecha: {like: `${soloFecha}%`}},
      include: [{relation: 'venta'}],
    }) as any[];
    const totalDevoluciones = devolucionesDelDia.reduce(
      (s: number, d: any) => s + ((d.venta?.Precio ?? 0) * (d.Cantidad ?? 0)),
      0,
    );

    // --- Métodos de pago del día (consulta por fecha directamente para mayor robustez) ---
    const pagosDelDia = await this.pagoFacturaRepository.find({
      where: {Fecha: {like: `${soloFecha}%`}},
      include: [{relation: 'metodoPago'}],
    }) as any[];

    // --- Créditos del día ---
    let totalCreditos = 0;
    const facturasConCredito = await this.facturaRepository.find({
      where: {Fecha: {like: `${soloFecha}%`}},
      include: [{relation: 'ventas'}, {relation: 'pagoFacturas'}, {relation: 'creditos'}],
    }) as any[];

    for (const f of facturasConCredito) {
      if (f.creditos && f.creditos.length > 0) {
        const totalVentaCredito = (f.ventas ?? []).reduce(
          (s: number, v: any) => s + ((v.Cantidad || 0) * (v.Precio || 0)),
          0,
        );
        const totalFactura = (f.Total && f.Total > 0) ? f.Total : totalVentaCredito;
        const pagos = (f.pagoFacturas ?? []).sort((a: any, b: any) => (a.id ?? 0) - (b.id ?? 0));
        const abonoInicial = pagos.length > 0 ? (pagos[0].Monto ?? 0) : 0;
        const saldoCreditoGenerado = Math.max(0, totalFactura - abonoInicial);
        totalCreditos += saldoCreditoGenerado;
      }
    }

    // --- Abonos del día ---
    const facturaIdsConPagos = pagosDelDia
      .map((p: any) => p.facturaId)
      .filter((id): id is number => typeof id === 'number');

    let totalAbonos = 0;
    if (facturaIdsConPagos.length > 0) {
      const creditosExistentes = await this.creditoRepository.find({
        where: {facturaId: {inq: facturaIdsConPagos}},
      });
      const facturasConCreditoSet = new Set(creditosExistentes.map(c => c.facturaId));
      totalAbonos = pagosDelDia
        .filter((p: any) => p.facturaId && facturasConCreditoSet.has(p.facturaId))
        .reduce((s: number, p: any) => s + (p.Monto ?? 0), 0);
    }

    const metodoPagoMap = new Map<number, {nombre: string; valor: number}>();
    for (const p of pagosDelDia) {
      const mpId = p.metodoPagoId;
      const nombre = p.metodoPago?.Nombre ?? 'Otro';
      const acc = metodoPagoMap.get(mpId) ?? {nombre, valor: 0};
      acc.valor += p.Monto ?? 0;
      metodoPagoMap.set(mpId, acc);
    }
    const resumenMetodoPago = Array.from(metodoPagoMap.values());
    const totalMetodoPago = resumenMetodoPago.reduce((s, m) => s + m.valor, 0);

    // --- Efectivo y queda en caja ---
    const ventasEfectivo = pagosDelDia
      .filter((p: any) => p.metodoPagoId === 1)
      .reduce((s: number, p: any) => s + (p.Monto ?? 0), 0);
    const base = cierre.Base ?? 0;
    const entregaCierre = cierre.Entrega ?? 0;
    const efectivoEnCaja = ventasEfectivo + base - totalGastos - totalEntregas - totalDevoluciones;
    const quedaEnCaja = efectivoEnCaja - entregaCierre;
    const totalZapatosVendidos = ventas.reduce((s, v) => s + v.Cantidad, 0);

    const WIDTH = 32;
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

    // ===== TITULO Y FECHA =====
    buffers.push(
      CENTER,
      BOLD_ON,
      Buffer.from('CIERRE DE CAJA\n'),
      BOLD_OFF,
      LEFT,
      Buffer.from(`Apertura: ${this.formatDate(cierre.FechaHoraApertura)}\n`),
    );
    if (cierre.FechaHoraCierre) {
      buffers.push(Buffer.from(`Cierre:   ${this.formatDate(cierre.FechaHoraCierre)}\n`));
    }
    buffers.push(
      Buffer.from(`Estado:   ${cierre.Estado ?? 'Abierta'}\n`),
      LINE,
    );

    // ===== RESUMEN RAPIDO =====
    buffers.push(
      Buffer.from(this.formatRow('Base de caja', this.money(base), WIDTH) + '\n'),
      Buffer.from(this.formatRow('Devoluciones', `-${this.money(totalDevoluciones)}`, WIDTH) + '\n'),
      Buffer.from(this.formatRow('Credito', `-${this.money(totalCreditos)}`, WIDTH) + '\n'),
      Buffer.from(this.formatRow('Abonos', this.money(totalAbonos), WIDTH) + '\n'),
      LINE,
    );

    // ===== RESUMEN VENTAS =====
    buffers.push(BOLD_ON, Buffer.from('RESUMEN VENTAS\n'), BOLD_OFF);
    if (resumenVentas.length === 0) {
      buffers.push(Buffer.from('Sin ventas\n'));
    } else {
      buffers.push(Buffer.from(this.formatThreeCols('Desc', 'Cant', 'Valor', WIDTH) + '\n'));
      for (const item of resumenVentas) {
        buffers.push(
          Buffer.from(this.formatThreeCols(
            item.descripcion.substring(0, 12),
            String(item.cantidad),
            this.money(item.valor),
            WIDTH,
          ) + '\n'),
        );
      }
      buffers.push(
        Buffer.from(this.formatRow('Total Ventas', this.money(totalVentas), WIDTH) + '\n'),
      );
    }
    buffers.push(LINE);

    // ===== GASTOS =====
    buffers.push(BOLD_ON, Buffer.from('GASTOS\n'), BOLD_OFF);
    if (gastosDelDia.length === 0) {
      buffers.push(Buffer.from('Sin gastos\n'));
    } else {
      for (const g of gastosDelDia) {
        buffers.push(
          Buffer.from(this.formatRow(
            (g.Concepto ?? 'Gasto').substring(0, 18),
            this.money(g.Valor ?? 0),
            WIDTH,
          ) + '\n'),
        );
      }
      buffers.push(
        Buffer.from(this.formatRow('Total Gastos', this.money(totalGastos), WIDTH) + '\n'),
      );
    }
    buffers.push(LINE);

    // ===== ENTREGAS =====
    buffers.push(BOLD_ON, Buffer.from('ENTREGAS\n'), BOLD_OFF);
    if (entregasDelDia.length === 0) {
      buffers.push(Buffer.from('Sin entregas\n'));
    } else {
      for (const e of entregasDelDia) {
        buffers.push(
          Buffer.from(this.formatRow(
            (e.EmpresaTrans ?? 'Empresa').substring(0, 18),
            this.money(e.Cobro ?? 0),
            WIDTH,
          ) + '\n'),
        );
      }
      buffers.push(
        Buffer.from(this.formatRow('Total Entregas', this.money(totalEntregas), WIDTH) + '\n'),
      );
    }
    buffers.push(LINE);

    // ===== METODOS DE PAGO =====
    buffers.push(BOLD_ON, Buffer.from('METODOS DE PAGO\n'), BOLD_OFF);
    if (resumenMetodoPago.length === 0) {
      buffers.push(Buffer.from('Sin pagos\n'));
    } else {
      for (const mp of resumenMetodoPago) {
        buffers.push(
          Buffer.from(this.formatRow(
            mp.nombre.substring(0, 18),
            this.money(mp.valor),
            WIDTH,
          ) + '\n'),
        );
      }
      buffers.push(
        Buffer.from(this.formatRow('Total', this.money(totalMetodoPago), WIDTH) + '\n'),
      );
    }
    buffers.push(LINE);

    // ===== TOTALES EFECTIVO =====
    buffers.push(
      BOLD_ON,
      Buffer.from(this.formatRow('Entrega', this.money(entregaCierre), WIDTH) + '\n'),
      Buffer.from(this.formatRow('Efectivo Total', this.money(efectivoEnCaja), WIDTH) + '\n'),
      Buffer.from(this.formatRow('Queda en Caja', this.money(quedaEnCaja), WIDTH) + '\n'),
      BOLD_OFF,
    );

    // Mostrar MontoReal y Diferencia si ya se cerró
    if (cierre.Estado === 'Cerrada') {
      buffers.push(
        LINE,
        BOLD_ON,
        Buffer.from(this.formatRow('Monto Esperado', this.money(cierre.MontoEsperado ?? 0), WIDTH) + '\n'),
        Buffer.from(this.formatRow('Monto Real', this.money(cierre.MontoReal ?? 0), WIDTH) + '\n'),
        Buffer.from(this.formatRow('Diferencia', this.money(cierre.Diferencia ?? 0), WIDTH) + '\n'),
        BOLD_OFF,
      );
    }

    buffers.push(LINE);

    // ===== FOOTER =====
    buffers.push(
      CENTER,
      Buffer.from(local?.Mensaje ?? '¡Gracias por su compra!\n'),
      Buffer.from('\n'),
      LEFT,
      Buffer.from('Desarrollado por ADSI\n'),
      Buffer.from('adsi.notificaciones@gmail.com\n'),
      CUT,
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

  /**
   * Crea una fila de dos columnas: label a la izquierda y valor a la derecha.
   * El total nunca supera `width` caracteres.
   */
  private formatRow(label: string, value: string, width: number): string {
    const maxLabel = width - value.length - 1;
    const truncLabel = label.substring(0, maxLabel).padEnd(maxLabel);
    return `${truncLabel} ${value}`;
  }

  /**
   * Crea una fila de tres columnas alineadas dentro de `width` caracteres.
   * col1 | col2 centrado | col3 derecha
   */
  private formatThreeCols(col1: string, col2: string, col3: string, width: number): string {
    const c3 = col3.substring(0, 10);
    const c2 = col2.substring(0, 5).padEnd(5);
    const c1Len = width - c2.length - c3.length - 2;
    const c1 = col1.substring(0, c1Len).padEnd(c1Len);
    return `${c1} ${c2} ${c3}`;
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
