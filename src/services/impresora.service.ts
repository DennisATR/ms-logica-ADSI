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
  VendedorRepository,
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

// Líneas para impresora grande (80mm - 46 columnas)
const HEADER_LINE_80 = Buffer.from('-'.repeat(31) + '\n');
const LINE_80 = Buffer.from('-'.repeat(46) + '\n');

// Líneas para impresora pequeña (58mm - 32 columnas, como DIG-58IIA)
const HEADER_LINE_58 = Buffer.from('-'.repeat(31) + '\n');
const LINE_58 = Buffer.from('-'.repeat(32) + '\n');

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
    @repository(VendedorRepository)
    public vendedorRepository: VendedorRepository,
  ) { }

  private findUsbDevice(): any {
    let device = usb.findByIds(VENDOR_ID, PRODUCT_ID);
    if (device) return device;

    try {
      const list = usb.getDeviceList();
      for (const dev of list) {
        try {
          dev.open();
          const ifaces = dev.interfaces || [];
          const isPrinter = ifaces.some(
            (iface: any) =>
              iface.descriptor?.bInterfaceClass === 7 ||
              iface.endpoints?.some((e: any) => e.direction === 'out' && e.transferType === 2),
          );
          dev.close();
          if (isPrinter) return dev;
        } catch (e) {
          try { dev.close(); } catch { }
        }
      }
    } catch (e) { }
    return null;
  }

  async printFactura(factura: {id: number}, width: number = 32): Promise<void> {
    const buffer = await this.buildFacturaBuffer(factura.id, width);

    return new Promise((resolve, reject) => {
      const device = this.findUsbDevice();
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
  public async buildFacturaBuffer(facturaId: number, width: number = 32): Promise<Buffer> {
    const is80 = width >= 44;
    const headerLine = is80 ? HEADER_LINE_80 : HEADER_LINE_58;
    const line = is80 ? LINE_80 : LINE_58;
    const cols = is80 ? 46 : 32;

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
      headerLine,
      LEFT,
    );

    // ===== INFO FACTURA =====
    const pagos = factura.pagoFacturas ?? [];
    const abono = pagos.reduce((acc: number, pago: any) => acc + (pago.Monto ?? 0), 0);

    const clienteObj = (factura as any).cliente;
    let clienteNombre = 'Consumidor Final';
    let clienteIdentificacion = '';
    if (clienteObj) {
      const nombre = (clienteObj.Nombre || '').trim();
      const apellido = (clienteObj.Apellido || '').trim();
      clienteNombre = `${nombre} ${apellido}`.trim() || 'Consumidor Final';
      if (clienteObj.Identificacion) {
        clienteIdentificacion = String(clienteObj.Identificacion).trim();
      }
    }

    const vendedorObj = (factura as any).vendedor;
    let vendedorNombre = 'N/A';
    if (vendedorObj) {
      const nombre = (vendedorObj.Nombre || '').trim();
      const apellido = (vendedorObj.Apellido || '').trim();
      if (nombre && apellido) {
        vendedorNombre = `${nombre} ${apellido.charAt(0).toUpperCase()}.`;
      } else if (nombre) {
        vendedorNombre = nombre;
      } else if (apellido) {
        vendedorNombre = `${apellido.charAt(0).toUpperCase()}.`;
      }
    }

    buffers.push(
      this.toESCPOS(`Factura #: ${factura.id}\n`),
      this.toESCPOS(`Fecha: ${this.formatDate(factura.Fecha)}\n`),
      this.toESCPOS(`Cliente: ${clienteNombre}\n`),
    );

    if (clienteIdentificacion) {
      buffers.push(this.toESCPOS(`CC/NIT: ${clienteIdentificacion}\n`));
    }

    buffers.push(
      this.toESCPOS(`Vendedor: ${vendedorNombre}\n`),
      line,
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

    buffers.push(line);

    // ===== DETALLE =====
    buffers.push(BOLD_ON, this.toESCPOS('DETALLE\n'), BOLD_OFF);

    ventas.forEach((v: any) => {
      const esLocal = !v.esVirtual && v.almacenId === local?.almacenId;
      const descId = esLocal
        ? (v.zapato?.Descripcion || v.zapatoId || 'ITEM')
        : ((v.esVirtual && v.codigoVirtual) ? v.codigoVirtual : (v.zapatoId || 'ITEM'));

      if (is80) {
        const desc = descId.toString().substring(0, 20);
        buffers.push(
          this.toESCPOS(
            `${this.pad(desc, 20)} ${this.pad(String(v.Cantidad), 4)} ${this.pad(
              this.money(v.Precio),
              9,
            )} ${this.money(v.Cantidad * v.Precio)}\n`,
          ),
        );
      } else {
        const desc = descId.toString().substring(0, 32);
        buffers.push(
          this.toESCPOS(`${desc}\n`),
          this.toESCPOS(
            ` ${this.pad(String(v.Cantidad) + 'x', 5)} ${this.pad(this.money(v.Precio), 10)} = ${this.money(v.Cantidad * v.Precio).padStart(11)}\n`,
          ),
        );
      }
    });

    buffers.push(line);

    // ===== TOTALES =====
    const metodoPagoNombre = (pagos[0]?.metodoPago?.Nombre ?? '').toLowerCase();
    const esCredito = metodoPagoNombre.includes('credito') || metodoPagoNombre.includes('crédito');

    if (is80) {
      buffers.push(BOLD_ON, this.toESCPOS(`TOTAL: ${this.money(factura.Total)}\n`), BOLD_OFF);

      if (esCredito) {
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
    } else {
      buffers.push(
        BOLD_ON,
        this.toESCPOS(this.formatRow('TOTAL:', this.money(factura.Total), cols) + '\n'),
        BOLD_OFF,
      );

      if (esCredito) {
        buffers.push(
          this.toESCPOS(this.formatRow('ABONO:', this.money(abono), cols) + '\n'),
          this.toESCPOS(this.formatRow('SALDO:', this.money(factura.Total - abono), cols) + '\n'),
        );
        const primerPago = pagos[0];
        if (primerPago && (primerPago.MontoRecibido ?? 0) > 0) {
          buffers.push(
            this.toESCPOS(this.formatRow('RECIBIDO:', this.money(primerPago.MontoRecibido), cols) + '\n'),
            this.toESCPOS(this.formatRow('CAMBIO:', this.money(primerPago.Cambio ?? 0), cols) + '\n'),
          );
        }
      } else {
        const primerPago = pagos[0];
        const montoRecibido = primerPago?.MontoRecibido ?? 0;
        const cambio = primerPago?.Cambio ?? 0;
        if (montoRecibido > 0) {
          buffers.push(
            this.toESCPOS(this.formatRow('RECIBIDO:', this.money(montoRecibido), cols) + '\n'),
            this.toESCPOS(this.formatRow('CAMBIO:', this.money(cambio), cols) + '\n'),
          );
        }
      }
    }

    buffers.push(line);

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

  async printCierreCaja(cierre: {id: number}, width: number = 32): Promise<void> {
    const buffer = await this.buildCierreCajaBuffer(cierre.id, width);

    return new Promise((resolve, reject) => {
      const device = this.findUsbDevice();
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

  public async buildCierreCajaBuffer(cierreId: number, width: number = 32): Promise<Buffer> {
    const is80 = width >= 44;
    const headerLine = is80 ? HEADER_LINE_80 : HEADER_LINE_58;
    const line = is80 ? LINE_80 : LINE_58;
    const WIDTH = is80 ? 44 : 32;
    const maxDesc = is80 ? 27 : 17;
    const maxConcepto = is80 ? 18 : 15;

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

    // --- Ventas del día (resumen por zapato y vendedores) ---
    const facturasDelDia = await this.facturaRepository.find({
      where: {Fecha: {like: `${soloFecha}%`}},
      include: [{relation: 'ventas'}, {relation: 'vendedor'}],
    }) as any[];

    const facturaIds = facturasDelDia
      .map(f => f.id)
      .filter((id): id is number => typeof id === 'number');

    // Vendedores y zapatos vendidos
    const vendedorIds = Array.from(new Set(facturasDelDia.map(f => f.vendedorId).filter(id => id != null)));
    const vendedoresList = vendedorIds.length > 0
      ? await this.vendedorRepository.find({where: {id: {inq: vendedorIds}}})
      : [];
    const vendedorNombreMap = new Map<string, string>();
    for (const v of vendedoresList) {
      vendedorNombreMap.set(String(v.id), `${v.Nombre} ${v.Apellido}`.trim());
    }

    const vendedoresVentasMap = new Map<string, {vendedor: string; zapatosVendidos: number}>();
    for (const f of facturasDelDia) {
      const vId = String(f.vendedorId || '');
      const nombreVendedor = f.vendedor ? `${f.vendedor.Nombre} ${f.vendedor.Apellido}`.trim() : (vendedorNombreMap.get(vId) || 'Vendedor');
      const zapatosEnFactura = (f.ventas ?? []).reduce((s: number, v: any) => s + (v.Cantidad || 0), 0);

      const acc = vendedoresVentasMap.get(nombreVendedor) ?? {vendedor: nombreVendedor, zapatosVendidos: 0};
      acc.zapatosVendidos += zapatosEnFactura;
      vendedoresVentasMap.set(nombreVendedor, acc);
    }
    const vendedoresVentas = Array.from(vendedoresVentasMap.values());

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

      const desc = descId.toString().substring(0, maxDesc);
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
      headerLine,
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
      line,
    );

    // ===== RESUMEN RAPIDO =====
    buffers.push(
      this.toESCPOS(this.formatRow('Base de caja', this.money(base), WIDTH) + '\n'),
      this.toESCPOS(this.formatRow('Devoluciones', `-${this.money(totalDevoluciones)}`, WIDTH) + '\n'),
      this.toESCPOS(this.formatRow('Credito', `-${this.money(totalCreditos)}`, WIDTH) + '\n'),
      this.toESCPOS(this.formatRow('Abonos', this.money(totalAbonos), WIDTH) + '\n'),
    );

    for (const vv of vendedoresVentas) {
      buffers.push(
        this.toESCPOS(this.formatRow(`- ${vv.vendedor}`, `${vv.zapatosVendidos} zap.`, WIDTH) + '\n'),
      );
    }

    buffers.push(line);

    // ===== RESUMEN VENTAS =====
    buffers.push(BOLD_ON, this.toESCPOS('RESUMEN VENTAS\n'), BOLD_OFF);
    if (resumenVentas.length === 0) {
      buffers.push(this.toESCPOS('Sin ventas\n'));
    } else {
      buffers.push(this.toESCPOS(this.formatThreeCols('Desc', 'Cant', 'Valor', WIDTH) + '\n'));
      for (const item of resumenVentas) {
        buffers.push(
          this.toESCPOS(this.formatThreeCols(
            item.descripcion.substring(0, maxDesc),
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
    buffers.push(line);

    // ===== GASTOS =====
    buffers.push(BOLD_ON, this.toESCPOS('GASTOS\n'), BOLD_OFF);
    if (gastosDelDia.length === 0) {
      buffers.push(this.toESCPOS('Sin gastos\n'));
    } else {
      for (const g of gastosDelDia) {
        buffers.push(
          this.toESCPOS(this.formatRow(
            (g.Concepto ?? 'Gasto').substring(0, maxConcepto),
            this.money(g.Valor ?? 0),
            WIDTH,
          ) + '\n'),
        );
      }
      buffers.push(
        this.toESCPOS(this.formatRow('Total Gastos', this.money(totalGastos), WIDTH) + '\n'),
      );
    }
    buffers.push(line);

    // ===== ENTREGAS =====
    buffers.push(BOLD_ON, this.toESCPOS('ENTREGAS\n'), BOLD_OFF);
    if (entregasDelDia.length === 0) {
      buffers.push(this.toESCPOS('Sin entregas\n'));
    } else {
      for (const e of entregasDelDia) {
        buffers.push(
          this.toESCPOS(this.formatRow(
            (e.EmpresaTrans ?? 'Empresa').substring(0, maxConcepto),
            this.money(e.Cobro ?? 0),
            WIDTH,
          ) + '\n'),
        );
      }
      buffers.push(
        this.toESCPOS(this.formatRow('Total Entregas', this.money(totalEntregas), WIDTH) + '\n'),
      );
    }
    buffers.push(line);

    // ===== METODOS DE PAGO =====
    buffers.push(BOLD_ON, this.toESCPOS('METODOS DE PAGO\n'), BOLD_OFF);
    if (resumenMetodoPago.length === 0) {
      buffers.push(this.toESCPOS('Sin pagos\n'));
    } else {
      for (const mp of resumenMetodoPago) {
        buffers.push(
          this.toESCPOS(this.formatRow(
            mp.nombre.substring(0, maxConcepto),
            this.money(mp.valor),
            WIDTH,
          ) + '\n'),
        );
      }
      buffers.push(
        this.toESCPOS(this.formatRow('Total', this.money(totalMetodoPago), WIDTH) + '\n'),
      );
    }
    buffers.push(line);

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
        line,
        BOLD_ON,
        this.toESCPOS(this.formatRow('Monto Esperado', this.money(cierre.MontoEsperado ?? 0), WIDTH) + '\n'),
        this.toESCPOS(this.formatRow('Monto Real', this.money(cierre.MontoReal ?? 0), WIDTH) + '\n'),
        this.toESCPOS(this.formatRow('Diferencia', this.money(cierre.Diferencia ?? 0), WIDTH) + '\n'),
        BOLD_OFF,
      );
    }

    buffers.push(line);

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
   * El total nunca supera `width` caracteres (predeterminado 32 para 58mm).
   */
  private formatRow(label: string, value: string, width: number = 32): string {
    const maxLabel = width - value.length - 1;
    const truncLabel = label.substring(0, maxLabel).padEnd(maxLabel);
    return `${truncLabel} ${value}`;
  }

  /**
   * Crea una fila de tres columnas alineadas dentro de `width` caracteres (32 para 58mm).
   * col1 | col2 centrado | col3 derecha
   */
  private formatThreeCols(col1: string, col2: string, col3: string, width: number = 32): string {
    const c3 = col3.substring(0, 9).padStart(9);
    const c2 = col2.substring(0, 4).padStart(4);
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

