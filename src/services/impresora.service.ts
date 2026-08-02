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
// Seleccionar code page CP850 (ESC t 2) para caracteres españoles (ñ, á, é, etc.)
const SET_CP850 = Buffer.from([0x1B, 0x74, 0x02]);
const CENTER = Buffer.from([0x1B, 0x61, 0x01]);
const LEFT = Buffer.from([0x1B, 0x61, 0x00]);
const BOLD_ON = Buffer.from([0x1B, 0x45, 0x01]);
const BOLD_OFF = Buffer.from([0x1B, 0x45, 0x00]);
const DOUBLE_SIZE = Buffer.from([0x1D, 0x21, 0x11]);
const NORMAL_SIZE = Buffer.from([0x1D, 0x21, 0x00]);
const CUT = Buffer.from([0x1D, 0x56, 0x41, 0x10]);
const CASH_DRAWER = Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]);

// Línea del encabezado y línea general de 46 guiones
const HEADER_LINE = Buffer.from('-'.repeat(31) + '\n');
const LINE = Buffer.from('-'.repeat(46) + '\n');

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
      SET_CP850,
      CENTER,
      DOUBLE_SIZE,
      BOLD_ON,
      this.toESCPOS(`${local?.Nombre ?? 'LOCAL'}\n`),
      BOLD_OFF,
      NORMAL_SIZE,
      this.toESCPOS(`NIT: ${local?.NIT ?? 'N/A'}\n`),
      this.toESCPOS(`Dir: ${local?.Direccion ?? 'N/A'}\n`),
      this.toESCPOS(`Tel: ${local?.Telefono ?? 'N/A'}\n`),
      HEADER_LINE,
      LEFT,
    );

    // ===== INFO FACTURA =====
    const pagos = factura.pagoFacturas ?? [];
    const abono = pagos.reduce((acc: number, pago: any) => acc + (pago.Monto ?? 0), 0);

    buffers.push(
      this.toESCPOS(`Factura #: ${factura.id}\n`),
      this.toESCPOS(`Fecha: ${this.formatDate(factura.Fecha)}\n`),
      this.toESCPOS(`Cliente: ${(factura as any).cliente?.Nombre ?? 'Consumidor Final'}\n`),
      this.toESCPOS(`Vendedor: ${factura.vendedor?.Nombre ?? 'N/A'}\n`),
      LINE,
    );

    if (pagos.length === 0) {
      buffers.push(this.toESCPOS('Pagos: Sin registros\n'));
    } else {
      buffers.push(this.toESCPOS('Pagos:\n'));
      pagos.forEach((pago: any) => {
        buffers.push(
          this.toESCPOS(`- ${pago.metodoPago?.Nombre ?? 'N/A'}: ${this.money(pago.Monto ?? 0)}\n`),
        );
      });
    }

    buffers.push(LINE);

    // ===== DETALLE =====
    buffers.push(BOLD_ON, this.toESCPOS('DETALLE\n'), BOLD_OFF);

    ventas.forEach((v: any) => {
      const esLocal = !v.esVirtual && v.almacenId === local?.almacenId;
      const descId = esLocal
        ? (v.zapato?.Descripcion || v.zapatoId || 'ITEM')
        : ((v.esVirtual && v.codigoVirtual) ? v.codigoVirtual : (v.zapatoId || 'ITEM'));

      const desc = descId.toString().substring(0, 20);
      buffers.push(
        this.toESCPOS(
          `${this.pad(desc, 20)} ${this.pad(String(v.Cantidad), 4)} ${this.pad(
            this.money(v.Precio),
            9,
          )} ${this.money(v.Cantidad * v.Precio)}\n`,
        ),
      );
    });

    buffers.push(LINE);

    // ===== TOTALES =====
    const metodoPagoNombre = (pagos[0]?.metodoPago?.Nombre ?? '').toLowerCase();
    const esCredito = metodoPagoNombre.includes('credito') || metodoPagoNombre.includes('crédito');

    buffers.push(BOLD_ON, this.toESCPOS(`TOTAL: ${this.money(factura.Total)}\n`), BOLD_OFF);

    if (esCredito) {
      // Crédito: abono acumulado, saldo pendiente + lo recibido/cambio de este pago
      buffers.push(
        this.toESCPOS(`ABONO:    ${this.money(abono)}\n`),
        this.toESCPOS(`SALDO:    ${this.money(factura.Total - abono)}\n`),
      );
      const primerPago = pagos[0];
      if (primerPago && (primerPago.MontoRecibido ?? 0) > 0) {
        buffers.push(
          this.toESCPOS(`RECIBIDO: ${this.money(primerPago.MontoRecibido)}\n`),
          this.toESCPOS(`CAMBIO:   ${this.money(primerPago.Cambio ?? 0)}\n`),
        );
      }
    } else {
      // Contado/Efectivo/Transferencia: solo recibido y cambio si aplica
      const primerPago = pagos[0];
      const montoRecibido = primerPago?.MontoRecibido ?? 0;
      const cambio = primerPago?.Cambio ?? 0;
      if (montoRecibido > 0) {
        buffers.push(
          this.toESCPOS(`RECIBIDO: ${this.money(montoRecibido)}\n`),
          this.toESCPOS(`CAMBIO:   ${this.money(cambio)}\n`),
        );
      }
    }

    buffers.push(LINE);

    // ===== FOOTER =====
    buffers.push(
      CENTER,
      this.toESCPOS(local?.Mensaje ?? '¡Gracias por su compra!\n'),
      this.toESCPOS('\n'),
      LEFT,
      this.toESCPOS('Desarrollado por ADSI\n'),
      this.toESCPOS('adsi.notificaciones@gmail.com\n'),
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
        try {device.close();} catch { }
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
        const bogotaDate = new Date(d.toLocaleString('en-US', {timeZone: 'America/Bogota'}));
        const yyyy = bogotaDate.getFullYear();
        const mm = String(bogotaDate.getMonth() + 1).padStart(2, '0');
        const dd = String(bogotaDate.getDate()).padStart(2, '0');
        soloFecha = `${yyyy}-${mm}-${dd}`;
      } else {
        throw new Error('Fecha inválida');
      }
    } catch (e) {
      // Fallback a hoy en caso de que todo falle
      const bogotaDate = new Date(new Date().toLocaleString('en-US', {timeZone: 'America/Bogota'}));
      const yyyy = bogotaDate.getFullYear();
      const mm = String(bogotaDate.getMonth() + 1).padStart(2, '0');
      const dd = String(bogotaDate.getDate()).padStart(2, '0');
      soloFecha = `${yyyy}-${mm}-${dd}`;
    }

    // --- Ventas del día (resumen por zapato) ---
    const facturasDelDia = await this.facturaRepository.find({
      where: {Fecha: {like: `${soloFecha}%`}},
      fields: {id: true, Total: true},
    });

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
      const esLocal = !v.esVirtual && v.almacenId === local?.almacenId;
      const descId = esLocal
        ? (v.zapato?.Descripcion || v.zapatoId || 'ITEM')
        : ((v.esVirtual && v.codigoVirtual) ? v.codigoVirtual : (v.zapatoId || 'ITEM'));

      const desc = descId.toString().substring(0, 27);
      const clave = descId.toString();
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

    // --- Métodos de pago del día ---
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

    const WIDTH = 44;
    const buffers: Buffer[] = [];

    // ===== HEADER =====
    buffers.push(
      INIT,
      SET_CP850,
      CENTER,
      DOUBLE_SIZE,
      BOLD_ON,
      this.toESCPOS(`${local?.Nombre ?? 'LOCAL'}\n`),
      BOLD_OFF,
      NORMAL_SIZE,
      this.toESCPOS(`NIT: ${local?.NIT ?? 'N/A'}\n`),
      this.toESCPOS(`Dir: ${local?.Direccion ?? 'N/A'}\n`),
      this.toESCPOS(`Tel: ${local?.Telefono ?? 'N/A'}\n`),
      HEADER_LINE,
      LEFT,
    );

    // ===== TITULO Y FECHA =====
    buffers.push(
      CENTER,
      BOLD_ON,
      this.toESCPOS('CIERRE DE CAJA\n'),
      BOLD_OFF,
      LEFT,
      this.toESCPOS(`Apertura: ${this.formatDate(cierre.FechaHoraApertura)}\n`),
    );
    if (cierre.FechaHoraCierre) {
      buffers.push(this.toESCPOS(`Cierre:   ${this.formatDate(cierre.FechaHoraCierre)}\n`));
    }
    buffers.push(
      this.toESCPOS(`Estado:   ${cierre.Estado ?? 'Abierta'}\n`),
      LINE,
    );

    // ===== RESUMEN RAPIDO =====
    buffers.push(
      this.toESCPOS(this.formatRow('Base de caja', this.money(base), WIDTH) + '\n'),
      this.toESCPOS(this.formatRow('Devoluciones', `-${this.money(totalDevoluciones)}`, WIDTH) + '\n'),
      this.toESCPOS(this.formatRow('Credito', `-${this.money(totalCreditos)}`, WIDTH) + '\n'),
      this.toESCPOS(this.formatRow('Abonos', this.money(totalAbonos), WIDTH) + '\n'),
      LINE,
    );

    // ===== RESUMEN VENTAS =====
    buffers.push(BOLD_ON, this.toESCPOS('RESUMEN VENTAS\n'), BOLD_OFF);
    if (resumenVentas.length === 0) {
      buffers.push(this.toESCPOS('Sin ventas\n'));
    } else {
      buffers.push(this.toESCPOS(this.formatThreeCols('Desc', 'Cant', 'Valor', WIDTH) + '\n'));
      for (const item of resumenVentas) {
        buffers.push(
          this.toESCPOS(this.formatThreeCols(
            item.descripcion.substring(0, 27),
            String(item.cantidad),
            this.money(item.valor),
            WIDTH,
          ) + '\n'),
        );
      }
      buffers.push(
        this.toESCPOS(this.formatRow('Total Ventas', this.money(totalVentas), WIDTH) + '\n'),
      );
    }
    buffers.push(LINE);

    // ===== GASTOS =====
    buffers.push(BOLD_ON, this.toESCPOS('GASTOS\n'), BOLD_OFF);
    if (gastosDelDia.length === 0) {
      buffers.push(this.toESCPOS('Sin gastos\n'));
    } else {
      for (const g of gastosDelDia) {
        buffers.push(
          this.toESCPOS(this.formatRow(
            (g.Concepto ?? 'Gasto').substring(0, 18),
            this.money(g.Valor ?? 0),
            WIDTH,
          ) + '\n'),
        );
      }
      buffers.push(
        this.toESCPOS(this.formatRow('Total Gastos', this.money(totalGastos), WIDTH) + '\n'),
      );
    }
    buffers.push(LINE);

    // ===== ENTREGAS =====
    buffers.push(BOLD_ON, this.toESCPOS('ENTREGAS\n'), BOLD_OFF);
    if (entregasDelDia.length === 0) {
      buffers.push(this.toESCPOS('Sin entregas\n'));
    } else {
      for (const e of entregasDelDia) {
        buffers.push(
          this.toESCPOS(this.formatRow(
            (e.EmpresaTrans ?? 'Empresa').substring(0, 18),
            this.money(e.Cobro ?? 0),
            WIDTH,
          ) + '\n'),
        );
      }
      buffers.push(
        this.toESCPOS(this.formatRow('Total Entregas', this.money(totalEntregas), WIDTH) + '\n'),
      );
    }
    buffers.push(LINE);

    // ===== METODOS DE PAGO =====
    buffers.push(BOLD_ON, this.toESCPOS('METODOS DE PAGO\n'), BOLD_OFF);
    if (resumenMetodoPago.length === 0) {
      buffers.push(this.toESCPOS('Sin pagos\n'));
    } else {
      for (const mp of resumenMetodoPago) {
        buffers.push(
          this.toESCPOS(this.formatRow(
            mp.nombre.substring(0, 18),
            this.money(mp.valor),
            WIDTH,
          ) + '\n'),
        );
      }
      buffers.push(
        this.toESCPOS(this.formatRow('Total', this.money(totalMetodoPago), WIDTH) + '\n'),
      );
    }
    buffers.push(LINE);

    // ===== TOTALES EFECTIVO =====
    buffers.push(
      BOLD_ON,
      this.toESCPOS(this.formatRow('Entrega', this.money(entregaCierre), WIDTH) + '\n'),
      this.toESCPOS(this.formatRow('Efectivo Total', this.money(efectivoEnCaja), WIDTH) + '\n'),
      this.toESCPOS(this.formatRow('Queda en Caja', this.money(quedaEnCaja), WIDTH) + '\n'),
      BOLD_OFF,
    );

    // Mostrar MontoReal y Diferencia si ya se cerró
    if (cierre.Estado === 'Cerrada') {
      buffers.push(
        LINE,
        BOLD_ON,
        this.toESCPOS(this.formatRow('Monto Esperado', this.money(cierre.MontoEsperado ?? 0), WIDTH) + '\n'),
        this.toESCPOS(this.formatRow('Monto Real', this.money(cierre.MontoReal ?? 0), WIDTH) + '\n'),
        this.toESCPOS(this.formatRow('Diferencia', this.money(cierre.Diferencia ?? 0), WIDTH) + '\n'),
        BOLD_OFF,
      );
    }

    buffers.push(LINE);

    // ===== FOOTER =====
    buffers.push(
      CENTER,
      this.toESCPOS(local?.Mensaje ?? '!Gracias por su compra!\n'),
      this.toESCPOS('\n'),
      LEFT,
      this.toESCPOS('Desarrollado por ADSI\n'),
      this.toESCPOS('adsi.notificaciones@gmail.com\n'),
      CUT,
    );

    return Buffer.concat(buffers as Uint8Array[]);
  }

  // ===== HELPERS =====

  /**
   * Convierte texto UTF-8 con caracteres españoles al encoding CP850
   * que usan las impresoras térmicas ESC/POS.
   * Esto resuelve el problema de que ñ, ú, etc. no se imprimen correctamente.
   */
  private toESCPOS(text: string): Buffer {
    const map: {[key: string]: number} = {
      // Minúsculas acentuadas
      '\u00e1': 0xa0, // á
      '\u00e9': 0x82, // é
      '\u00ed': 0xa1, // í
      '\u00f3': 0xa2, // ó
      '\u00fa': 0xa3, // ú
      '\u00fc': 0x81, // ü
      '\u00f1': 0xa4, // ñ
      '\u00bf': 0xa8, // ¿
      '\u00a1': 0xad, // ¡
      // Mayúsculas acentuadas
      '\u00c1': 0xb5, // Á
      '\u00c9': 0x90, // É
      '\u00cd': 0xd6, // Í
      '\u00d3': 0xe0, // Ó
      '\u00da': 0xe9, // Ú
      '\u00dc': 0x9a, // Ü
      '\u00d1': 0xa5, // Ñ
    };
    const bytes: number[] = [];
    for (const ch of text) {
      const code = map[ch];
      if (code !== undefined) {
        bytes.push(code);
      } else {
        // Para caracteres ASCII normales, usar el código ASCII
        const ascii = ch.charCodeAt(0);
        bytes.push(ascii < 256 ? ascii : 0x3f); // 0x3f = '?'
      }
    }
    return Buffer.from(bytes);
  }

  private money(valor: number): string {
    const entero = Math.round(valor || 0);
    const sign = entero < 0 ? '-' : '';
    const str = Math.abs(entero).toString();

    let result = '';

    if (str.length <= 3) {
      result = str;
    } else {
      let count = 0;
      for (let i = str.length - 1; i >= 0; i--) {
        if (count > 0 && count % 3 === 0) {
          if (count === 6) {
            result = "'" + result;
          } else {
            result = "." + result;
          }
        }
        result = str[i] + result;
        count++;
      }
    }
    return sign + '$' + result;
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
    const c3 = col3.substring(0, 10).padStart(10);
    const c2 = col2.substring(0, 5).padStart(5);
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
