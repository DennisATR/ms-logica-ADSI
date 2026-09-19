import {get, param, response} from '@loopback/rest';
import {repository} from '@loopback/repository';
import {
  CreditoRepository,
  EntregaRepository,
  FacturaRepository,
  GastosRepository,
  MetodoPagoRepository,
  PagoFacturaRepository,
  VentaRepository,
  ZapatoRepository,
} from '../repositories';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Parsea cualquier formato de fecha que devuelva MySQL/LoopBack */
function parseFecha(raw: string | Date | undefined | null): Date {
  if (!raw) return new Date(NaN);
  const str =
    typeof raw === 'string'
      ? raw.replace(/\s*\(.*?\)$/, '').trim()
      : (raw as Date).toString();
  return new Date(str);
}

function formatFechaISO(raw: string | Date | undefined | null): string {
  const d = parseFecha(raw);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export class DashboardController {
  constructor(
    @repository(FacturaRepository)
    public facturaRepository: FacturaRepository,
    @repository(VentaRepository)
    public ventaRepository: VentaRepository,
    @repository(ZapatoRepository)
    public zapatoRepository: ZapatoRepository,
    @repository(GastosRepository)
    public gastosRepository: GastosRepository,
    @repository(EntregaRepository)
    public entregaRepository: EntregaRepository,
    @repository(MetodoPagoRepository)
    public metodoPagoRepository: MetodoPagoRepository,
    @repository(PagoFacturaRepository)
    public pagoFacturaRepository: PagoFacturaRepository,
    @repository(CreditoRepository)
    public creditoRepository: CreditoRepository,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // HELPERS privados
  // ═══════════════════════════════════════════════════════════════

  private async obtenerFacturasEnRango(inicio: Date, fin: Date) {
    const todas = await this.facturaRepository.find();
    return todas.filter(f => {
      const d = parseFecha(f.Fecha as any);
      return !isNaN(d.getTime()) && d >= inicio && d <= fin;
    });
  }

  private async obtenerGastosEnRango(inicio: Date, fin: Date) {
    const todos = await this.gastosRepository.find();
    return todos.filter(g => {
      const d = parseFecha(g.Fecha as any);
      return !isNaN(d.getTime()) && d >= inicio && d <= fin;
    });
  }

  private async obtenerEntregasEnRango(inicio: Date, fin: Date) {
    const todas = await this.entregaRepository.find();
    return todas.filter(e => {
      const d = parseFecha(e.Fecha as any);
      return !isNaN(d.getTime()) && d >= inicio && d <= fin;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. KPIs — GET /dashboard/kpis?inicio=YYYY-MM-DD&fin=YYYY-MM-DD
  // ═══════════════════════════════════════════════════════════════
  @get('/dashboard/kpis')
  @response(200, {description: 'KPIs financieros del período seleccionado'})
  async obtenerKpis(
    @param.query.string('inicio') inicioStr?: string,
    @param.query.string('fin') finStr?: string,
  ) {
    const fin = finStr ? new Date(finStr + 'T23:59:59') : new Date();
    const inicio = inicioStr
      ? new Date(inicioStr + 'T00:00:00')
      : new Date(fin.getTime() - 30 * 24 * 60 * 60 * 1000);

    const facturas = await this.obtenerFacturasEnRango(inicio, fin);
    const facturaIds = facturas
      .map(f => f.id!)
      .filter(Boolean) as number[];

    const totalVentas = facturas.reduce((s, f) => s + (f.Total ?? 0), 0);
    const totalFacturas = facturas.length;
    const ticketPromedio =
      totalFacturas > 0 ? totalVentas / totalFacturas : 0;

    const ventas =
      facturaIds.length > 0
        ? await this.ventaRepository.find({
            where: {facturaId: {inq: facturaIds}},
            include: [{relation: 'zapato'}],
          })
        : [];

    const totalPares = ventas.reduce((s, v) => s + (v.Cantidad ?? 1), 0);

    const gananciaBruta = ventas.reduce((acc, v) => {
      const zapato = (v as any).zapato;
      const costo = zapato?.PrecioCosto ?? 0;
      const precio = v.Precio ?? 0;
      const cantidad = v.Cantidad ?? 1;
      return acc + (precio - costo) * cantidad;
    }, 0);

    const gastos = await this.obtenerGastosEnRango(inicio, fin);
    const entregas = await this.obtenerEntregasEnRango(inicio, fin);

    const totalGastos = gastos.reduce((s, g) => s + (g.Valor ?? 0), 0);
    const totalEntregas = entregas.reduce((s, e) => s + (e.Cobro ?? 0), 0);
    const totalEgresos = totalGastos + totalEntregas;
    const gananciaNeta = gananciaBruta - totalEgresos;
    const margenPorcentaje =
      totalVentas > 0
        ? Math.round((gananciaBruta / totalVentas) * 100)
        : 0;

    return {
      totalVentas,
      totalFacturas,
      ticketPromedio: Math.round(ticketPromedio),
      totalPares,
      gananciaBruta: Math.round(gananciaBruta),
      totalGastos,
      totalEntregas,
      totalEgresos,
      gananciaNeta: Math.round(gananciaNeta),
      margenPorcentaje,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. Línea temporal — GET /dashboard/ultimos-30-dias?inicio=&fin=
  // ═══════════════════════════════════════════════════════════════
  @get('/dashboard/ultimos-30-dias')
  @response(200, {
    description: 'Ventas, ganancias y egresos día a día en el rango de fechas',
  })
  async ultimos30Dias(
    @param.query.string('inicio') inicioStr?: string,
    @param.query.string('fin') finStr?: string,
  ) {
    const fin = finStr ? new Date(finStr + 'T23:59:59') : new Date();
    const inicio = inicioStr
      ? new Date(inicioStr + 'T00:00:00')
      : new Date(fin.getTime() - 29 * 24 * 60 * 60 * 1000);

    const facturas = await this.obtenerFacturasEnRango(inicio, fin);
    const facturaIds = facturas
      .map(f => f.id!)
      .filter(Boolean) as number[];

    const ventas =
      facturaIds.length > 0
        ? await this.ventaRepository.find({
            where: {facturaId: {inq: facturaIds}},
            include: [{relation: 'zapato'}],
          })
        : [];

    const gastos = await this.obtenerGastosEnRango(inicio, fin);
    const entregas = await this.obtenerEntregasEnRango(inicio, fin);

    const mapaFechaFactura = new Map<number, string>();
    facturas.forEach(f => {
      const dia = formatFechaISO(f.Fecha as any);
      if (dia) mapaFechaFactura.set(f.id!, dia);
    });

    const mapaVentas = new Map<string, {ventas: number; gananciaBruta: number}>();
    ventas.forEach(v => {
      const dia = mapaFechaFactura.get(v.facturaId!) ?? '';
      if (!dia) return;
      const zapato = (v as any).zapato;
      const costo = zapato?.PrecioCosto ?? 0;
      const precio = v.Precio ?? 0;
      const cantidad = v.Cantidad ?? 1;
      const prev = mapaVentas.get(dia) ?? {ventas: 0, gananciaBruta: 0};
      mapaVentas.set(dia, {
        ventas: prev.ventas + precio * cantidad,
        gananciaBruta: prev.gananciaBruta + (precio - costo) * cantidad,
      });
    });

    const mapaEgresos = new Map<string, number>();
    gastos.forEach(g => {
      const dia = formatFechaISO(g.Fecha as any);
      if (dia) mapaEgresos.set(dia, (mapaEgresos.get(dia) ?? 0) + (g.Valor ?? 0));
    });
    entregas.forEach(e => {
      const dia = formatFechaISO(e.Fecha as any);
      if (dia) mapaEgresos.set(dia, (mapaEgresos.get(dia) ?? 0) + (e.Cobro ?? 0));
    });

    const msPorDia = 24 * 60 * 60 * 1000;
    const numDias = Math.min(Math.max(1, Math.round((fin.getTime() - inicio.getTime()) / msPorDia)), 366);

    const resultado = [];
    for (let i = 0; i < numDias; i++) {
      const d = new Date(inicio.getTime() + i * msPorDia);
      const clave = formatFechaISO(d);
      const vData = mapaVentas.get(clave) ?? {ventas: 0, gananciaBruta: 0};
      resultado.push({
        etiqueta: clave,
        ventas: Math.round(vData.ventas),
        gananciaBruta: Math.round(vData.gananciaBruta),
        egresos: Math.round(mapaEgresos.get(clave) ?? 0),
      });
    }
    return resultado;
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. Análisis mensual — GET /dashboard/analisis-mensual?anio=
  // ═══════════════════════════════════════════════════════════════
  @get('/dashboard/analisis-mensual')
  @response(200, {description: 'Ventas, ganancias y egresos mes a mes'})
  async analisisMensual(@param.query.number('anio') anio?: number) {
    const year = anio ?? new Date().getFullYear();
    const inicio = new Date(`${year}-01-01T00:00:00`);
    const fin = new Date(`${year}-12-31T23:59:59`);

    const facturas = await this.obtenerFacturasEnRango(inicio, fin);
    const facturaIds = facturas
      .map(f => f.id!)
      .filter(Boolean) as number[];

    const ventas =
      facturaIds.length > 0
        ? await this.ventaRepository.find({
            where: {facturaId: {inq: facturaIds}},
            include: [{relation: 'zapato'}],
          })
        : [];

    const gastos = await this.obtenerGastosEnRango(inicio, fin);
    const entregas = await this.obtenerEntregasEnRango(inicio, fin);

    const mapaFechaFactura = new Map<number, number>();
    facturas.forEach(f => {
      const d = parseFecha(f.Fecha as any);
      mapaFechaFactura.set(f.id!, d.getMonth());
    });

    const mesData = Array.from({length: 12}, (_, i) => ({
      etiqueta: MESES[i],
      mes: i + 1,
      ventas: 0,
      gananciaBruta: 0,
      egresos: 0,
    }));

    ventas.forEach(v => {
      const mes = mapaFechaFactura.get(v.facturaId!);
      if (mes === undefined || mes < 0 || mes > 11) return;
      const zapato = (v as any).zapato;
      const costo = zapato?.PrecioCosto ?? 0;
      const precio = v.Precio ?? 0;
      const cantidad = v.Cantidad ?? 1;
      mesData[mes].ventas += precio * cantidad;
      mesData[mes].gananciaBruta += (precio - costo) * cantidad;
    });

    gastos.forEach(g => {
      const mes = parseFecha(g.Fecha as any).getMonth();
      if (mes < 0 || mes > 11) return;
      mesData[mes].egresos += g.Valor ?? 0;
    });

    entregas.forEach(e => {
      const mes = parseFecha(e.Fecha as any).getMonth();
      if (mes < 0 || mes > 11) return;
      mesData[mes].egresos += e.Cobro ?? 0;
    });

    return mesData.map(m => ({
      ...m,
      ventas: Math.round(m.ventas),
      gananciaBruta: Math.round(m.gananciaBruta),
      egresos: Math.round(m.egresos),
      gananciaNeta: Math.round(m.gananciaBruta - m.egresos),
    }));
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. Top Productos — GET /dashboard/top-productos?limite=20&categoria=
  // ═══════════════════════════════════════════════════════════════
  @get('/dashboard/top-productos')
  @response(200, {description: 'Top N referencias más vendidas por categoría'})
  async topProductos(
    @param.query.number('limite') limite?: number,
    @param.query.string('categoria') categoria?: string,
    @param.query.string('inicio') inicioStr?: string,
    @param.query.string('fin') finStr?: string,
  ) {
    const top = limite ?? 20;
    const fin = finStr ? new Date(finStr + 'T23:59:59') : undefined;
    const inicio = inicioStr ? new Date(inicioStr + 'T00:00:00') : undefined;

    let facturas = await this.facturaRepository.find();
    if (inicio && fin) {
      facturas = facturas.filter(f => {
        const d = parseFecha(f.Fecha as any);
        return !isNaN(d.getTime()) && d >= inicio && d <= fin;
      });
    }

    const facturaIds = facturas.map(f => f.id!).filter(Boolean) as number[];

    const filterWhere: any = {};
    if (facturaIds.length > 0) {
      filterWhere.facturaId = {inq: facturaIds};
    }

    const ventas = await this.ventaRepository.find({
      where: Object.keys(filterWhere).length > 0 ? filterWhere : undefined,
      include: [{relation: 'zapato'}],
    });

    const mapa = new Map<
      string,
      {
        zapatoId: string;
        descripcion: string;
        categoria: string;
        unidades: number;
        ingresos: number;
        ganancia: number;
      }
    >();

    const categoriasSet = new Set<string>();

    ventas.forEach(v => {
      const zapato = (v as any).zapato;
      if (!zapato) return;
      const cat = zapato.Categoria ?? 'General';
      if (cat) categoriasSet.add(cat);

      if (categoria && categoria.toLowerCase() !== 'todas' && cat.toLowerCase() !== categoria.toLowerCase()) {
        return;
      }

      const id = v.zapatoId ?? '';
      const costo = zapato.PrecioCosto ?? 0;
      const precio = v.Precio ?? 0;
      const cantidad = v.Cantidad ?? 1;
      const prev = mapa.get(id) ?? {
        zapatoId: id,
        descripcion: zapato.Descripcion ?? 'Zapato',
        categoria: cat,
        unidades: 0,
        ingresos: 0,
        ganancia: 0,
      };
      mapa.set(id, {
        ...prev,
        unidades: prev.unidades + cantidad,
        ingresos: prev.ingresos + precio * cantidad,
        ganancia: prev.ganancia + (precio - costo) * cantidad,
      });
    });

    const productos = Array.from(mapa.values())
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, top)
      .map(p => ({
        ...p,
        ingresos: Math.round(p.ingresos),
        ganancia: Math.round(p.ganancia),
      }));

    return {
      productos,
      categorias: Array.from(categoriasSet),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. Métodos de pago — GET /dashboard/metodos-pago?inicio=&fin=
  // ═══════════════════════════════════════════════════════════════
  @get('/dashboard/metodos-pago')
  @response(200, {description: 'Distribución de ingresos por método de pago'})
  async metodosPago(
    @param.query.string('inicio') inicioStr?: string,
    @param.query.string('fin') finStr?: string,
  ) {
    const fin = finStr ? new Date(finStr + 'T23:59:59') : new Date();
    const inicio = inicioStr
      ? new Date(inicioStr + 'T00:00:00')
      : new Date(fin.getTime() - 30 * 24 * 60 * 60 * 1000);

    const pagos = await this.pagoFacturaRepository.find({
      include: [{relation: 'metodoPago'}],
    });

    const pagosFiltrados = pagos.filter(p => {
      const d = parseFecha(p.Fecha as any);
      return !isNaN(d.getTime()) && d >= inicio && d <= fin;
    });

    const mapa = new Map<string, {nombre: string; total: number; cantidad: number}>();
    pagosFiltrados.forEach(p => {
      const nombre = (p as any).metodoPago?.Nombre ?? 'Sin método';
      const prev = mapa.get(nombre) ?? {nombre, total: 0, cantidad: 0};
      mapa.set(nombre, {
        nombre,
        total: prev.total + (p.Monto ?? 0),
        cantidad: prev.cantidad + 1,
      });
    });

    const totalGeneral = Array.from(mapa.values()).reduce(
      (s, v) => s + v.total,
      0,
    );

    return Array.from(mapa.values())
      .sort((a, b) => b.total - a.total)
      .map(m => ({
        ...m,
        porcentaje:
          totalGeneral > 0
            ? Math.round((m.total / totalGeneral) * 100)
            : 0,
      }));
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. Desglose egresos — GET /dashboard/egresos-desglose?inicio=&fin=
  // ═══════════════════════════════════════════════════════════════
  @get('/dashboard/egresos-desglose')
  @response(200, {description: 'Desglose detallado de gastos y entregas'})
  async egresosDesglose(
    @param.query.string('inicio') inicioStr?: string,
    @param.query.string('fin') finStr?: string,
  ) {
    const fin = finStr ? new Date(finStr + 'T23:59:59') : new Date();
    const inicio = inicioStr
      ? new Date(inicioStr + 'T00:00:00')
      : new Date(fin.getTime() - 30 * 24 * 60 * 60 * 1000);

    const gastos = await this.obtenerGastosEnRango(inicio, fin);
    const entregas = await this.obtenerEntregasEnRango(inicio, fin);

    const totalGastos = gastos.reduce((s, g) => s + (g.Valor ?? 0), 0);
    const totalEntregas = entregas.reduce((s, e) => s + (e.Cobro ?? 0), 0);

    return {
      totalGastos,
      totalEntregas,
      totalEgresos: totalGastos + totalEntregas,
      gastos: gastos.map(g => ({
        id: g.id,
        fecha: formatFechaISO(g.Fecha as any),
        concepto: g.Concepto,
        descripcion: g.Descripcion,
        valor: g.Valor,
      })),
      entregas: entregas.map(e => ({
        id: e.id,
        fecha: formatFechaISO(e.Fecha as any),
        empresa: e.EmpresaTrans,
        numCajas: e.NumCajas,
        cobro: e.Cobro,
      })),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. Análisis de Gastos y Promedio Diario — GET /dashboard/gastos-analisis
  // ═══════════════════════════════════════════════════════════════
  @get('/dashboard/gastos-analisis')
  @response(200, {description: 'Análisis detallado de gastos por concepto y promedios diarios'})
  async gastosAnalisis(
    @param.query.string('inicio') inicioStr?: string,
    @param.query.string('fin') finStr?: string,
  ) {
    const fin = finStr ? new Date(finStr + 'T23:59:59') : new Date();
    const inicio = inicioStr
      ? new Date(inicioStr + 'T00:00:00')
      : new Date(fin.getTime() - 29 * 24 * 60 * 60 * 1000);

    const gastos = await this.obtenerGastosEnRango(inicio, fin);
    const entregas = await this.obtenerEntregasEnRango(inicio, fin);

    const totalGastos = gastos.reduce((s, g) => s + (g.Valor ?? 0), 0);
    const totalEntregas = entregas.reduce((s, e) => s + (e.Cobro ?? 0), 0);
    const totalEgresos = totalGastos + totalEntregas;

    const msPorDia = 24 * 60 * 60 * 1000;
    const numDias = Math.max(1, Math.round((fin.getTime() - inicio.getTime()) / msPorDia) + 1);

    const promedioDiarioGastos = Math.round(totalGastos / numDias);
    const promedioDiarioEgresos = Math.round(totalEgresos / numDias);

    const mapaConceptos = new Map<string, {concepto: string; total: number; cantidad: number}>();
    gastos.forEach(g => {
      const conc = (g.Concepto ?? 'Otros Gastos').trim();
      const prev = mapaConceptos.get(conc) ?? {concepto: conc, total: 0, cantidad: 0};
      mapaConceptos.set(conc, {
        concepto: conc,
        total: prev.total + (g.Valor ?? 0),
        cantidad: prev.cantidad + 1,
      });
    });

    const conceptosList = Array.from(mapaConceptos.values())
      .sort((a, b) => b.total - a.total)
      .map(c => ({
        ...c,
        porcentaje: totalGastos > 0 ? Math.round((c.total / totalGastos) * 100) : 0,
      }));

    const conceptoMayorGasto = conceptosList.length > 0 ? conceptosList[0].concepto : 'N/A';

    return {
      totalGastos,
      totalEntregas,
      totalEgresos,
      numDias,
      promedioDiarioGastos,
      promedioDiarioEgresos,
      conceptoMayorGasto,
      porConceptos: conceptosList,
    };
  }

  // ═══════════════════════════════════════════════════════════════


  // ═══════════════════════════════════════════════════════════════
  // 8. Análisis de Créditos y Cartera — GET /dashboard/creditos-analisis
  // ═══════════════════════════════════════════════════════════════
  @get('/dashboard/creditos-analisis')
  @response(200, {description: 'Análisis de créditos, recaudos y cuentas por cobrar'})
  async creditosAnalisis(
    @param.query.string('inicio') inicioStr?: string,
    @param.query.string('fin') finStr?: string,
  ) {
    const fin = finStr ? new Date(finStr + 'T23:59:59') : new Date();
    const inicio = inicioStr
      ? new Date(inicioStr + 'T00:00:00')
      : new Date(fin.getTime() - 29 * 24 * 60 * 60 * 1000);

    // Obtener todos los créditos registrados
    const todosCreditos = await this.creditoRepository.find({
      include: [{relation: 'factura'}],
    });

    const facturas = await this.facturaRepository.find();
    const pagos = await this.pagoFacturaRepository.find();

    const mapaPagosFactura = new Map<number, number>();
    pagos.forEach(p => {
      const fid = p.facturaId;
      if (fid) {
        mapaPagosFactura.set(fid, (mapaPagosFactura.get(fid) ?? 0) + (p.Monto ?? 0));
      }
    });

    const mapaFactura = new Map<number, any>();
    facturas.forEach(f => {
      if (f.id) mapaFactura.set(f.id, f);
    });

    let totalCreditos = 0;
    let totalAbonado = 0;
    let creditosPendientesCount = 0;
    let creditosPagadosCount = 0;

    todosCreditos.forEach(c => {
      const factura = c.facturaId ? mapaFactura.get(c.facturaId) : null;
      const totalFac = factura ? (factura.Total ?? 0) : 0;
      const abonoFac = c.facturaId ? (mapaPagosFactura.get(c.facturaId) ?? 0) : 0;

      totalCreditos += totalFac;
      totalAbonado += Math.min(abonoFac, totalFac);

      if ((c.Estado ?? '').toLowerCase() === 'pagado' || abonoFac >= totalFac) {
        creditosPagadosCount++;
      } else {
        creditosPendientesCount++;
      }
    });

    const saldoPendiente = Math.max(0, totalCreditos - totalAbonado);
    const porcentajeRecaudo =
      totalCreditos > 0 ? Math.round((totalAbonado / totalCreditos) * 100) : 0;

    return {
      totalCreditos,
      totalAbonado,
      saldoPendiente,
      porcentajeRecaudo,
      creditosTotalCount: todosCreditos.length,
      creditosPendientesCount,
      creditosPagadosCount,
    };
  }

}