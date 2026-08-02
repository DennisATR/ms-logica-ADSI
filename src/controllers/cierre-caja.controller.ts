import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {service} from '@loopback/core';
import {CierreCaja, CierreCajaMetodoPago, Devolucion, EfectivoEnCaja} from '../models';
import {
  CierreCajaRepository,
  CierreCajaMetodoPagoRepository,
  CreditoRepository,
  DevolucionRepository,
  EntregaRepository,
  FacturaRepository,
  GastosRepository,
  MetodoPagoRepository,
  PagoFacturaRepository,
  VentaRepository,
  InfolocalRepository,
} from '../repositories';
import {ImpresoraService} from '../services';

export class CierreCajaController {
  constructor(
    @repository(CierreCajaRepository)
    public cierreCajaRepository: CierreCajaRepository,
    @repository(CierreCajaMetodoPagoRepository)
    public cierreCajaMetodoPagoRepository: CierreCajaMetodoPagoRepository,
    @repository(CreditoRepository)
    public creditoRepository: CreditoRepository,
    @repository(PagoFacturaRepository)
    public pagoFacturaRepository: PagoFacturaRepository,
    @repository(GastosRepository)
    public gastosRepository: GastosRepository,
    @repository(EntregaRepository)
    public entregaRepository: EntregaRepository,
    @repository(FacturaRepository)
    public facturaRepository: FacturaRepository,
    @repository(VentaRepository)
    public ventaRepository: VentaRepository,
    @repository(DevolucionRepository)
    public devolucionRepository: DevolucionRepository,
    @repository(MetodoPagoRepository)
    public metodoPagoRepository: MetodoPagoRepository,
    @repository(InfolocalRepository)
    public infolocalRepository: InfolocalRepository,
    @service(ImpresoraService)
    public impresoraService: ImpresoraService,
  ) { }

  @post('/cierre-caja')
  @response(200, {
    description: 'CierreCaja model instance',
    content: {'application/json': {schema: getModelSchemaRef(CierreCaja)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CierreCaja, {
            title: 'NewCierreCaja',
            exclude: ['id', 'FechaHoraApertura', 'FechaHoraCierre'],
          }),
        },
      },
    })
    cierreCaja: Omit<CierreCaja, 'id'>,
  ): Promise<CierreCaja> {
    const fechaRegistro = new Date().toLocaleString('sv-SE', {timeZone: 'America/Bogota'});
    cierreCaja.FechaHoraApertura = fechaRegistro;
    return this.cierreCajaRepository.create(cierreCaja);
  }

  @get('/cierre-caja/count')
  @response(200, {
    description: 'CierreCaja model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(CierreCaja) where?: Where<CierreCaja>,
  ): Promise<Count> {
    return this.cierreCajaRepository.count(where);
  }

  @get('/cierre-caja')
  @response(200, {
    description: 'Array of CierreCaja model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CierreCaja, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(CierreCaja) filter?: Filter<CierreCaja>,
  ): Promise<CierreCaja[]> {
    return this.cierreCajaRepository.find(filter);
  }

  @get('/cierre-caja/efectivo/fecha/{fecha}')
  @response(200, {
    description: 'Efectivo disponible en caja por fecha',
    content: {
      'application/json': {
        schema: getModelSchemaRef(EfectivoEnCaja),
      },
    },
  })
  async efectivoEnCajaPorFecha(
    @param.path.string('fecha') fecha: string,
  ): Promise<EfectivoEnCaja> {
    const soloFecha = fecha.slice(0, 10);

    // --- Ventas y Zapato del Día ---
    const facturasDelDia = await this.facturaRepository.find({
      where: {Fecha: {like: `${soloFecha}%`}},
      fields: {id: true, Total: true},
    });
    const facturaIds = facturasDelDia.map(f => f.id).filter((id): id is number => typeof id === 'number');

    const ventas = facturaIds.length > 0
      ? await this.ventaRepository.find({
          where: {facturaId: {inq: facturaIds}},
          include: [{relation: 'zapato'}],
        }) as any[]
      : [];

    const local = await this.infolocalRepository.findOne({order: ['id DESC']});

    const resumenVentasMap = new Map<string, {descripcion: string; cantidad: number; valor: number}>();
    for (const v of ventas) {
      const esLocal = !v.esVirtual && v.almacenId === local?.almacenId;
      const descId = esLocal 
        ? (v.zapato?.Descripcion || v.zapatoId || 'ITEM')
        : ((v.esVirtual && v.codigoVirtual) ? v.codigoVirtual : (v.zapatoId || 'ITEM'));
        
      const desc = descId.toString();
      const clave = desc;
      const acc = resumenVentasMap.get(clave) ?? {descripcion: desc, cantidad: 0, valor: 0};
      acc.cantidad += (v.Cantidad || 0);
      acc.valor += (v.Cantidad || 0) * (v.Precio || 0);
      resumenVentasMap.set(clave, acc);
    }
    const resumenVentas = Array.from(resumenVentasMap.values());
    const totalVentas = resumenVentas.reduce((s, i) => s + i.valor, 0);
    const totalZapatosVendidos = ventas.reduce((s, v) => s + (v.Cantidad || 0), 0);

    // --- Gastos del día ---
    const gastosDelDia = await this.gastosRepository.find({
      where: {Fecha: {like: `${soloFecha}%`}},
    });
    const gastos = gastosDelDia.reduce((s, g) => s + (g.Valor ?? 0), 0);
    const detalleGastos = gastosDelDia.map(g => ({
      concepto: g.Concepto ?? 'Gasto',
      cantidad: 1,
      valor: g.Valor ?? 0,
    }));

    // --- Entregas del día ---
    const entregasDelDia = await this.entregaRepository.find({
      where: {Fecha: {like: `${soloFecha}%`}},
    });
    const entrega = entregasDelDia.reduce((s, e) => s + (e.Cobro ?? 0), 0);
    const detalleEntregas = entregasDelDia.map(e => ({
      empresa: e.EmpresaTrans ?? 'Empresa',
      cantidadCajas: e.NumCajas ?? 1,
      cobro: e.Cobro ?? 0,
    }));

    // --- Métodos de pago ---
    // Usar facturaIds del día para filtrar pagos (más confiable que filtrar por Fecha)
    const pagosDelDia = facturaIds.length > 0
      ? await this.pagoFacturaRepository.find({
          where: {facturaId: {inq: facturaIds}},
          include: [{relation: 'metodoPago'}],
        }) as any[]
      : [];

    const metodoPagoMap = new Map<number, {nombre: string; valor: number}>();
    for (const p of pagosDelDia) {
      const mpId = p.metodoPagoId;
      const nombre = p.metodoPago?.Nombre ?? 'Otro';
      const acc = metodoPagoMap.get(mpId) ?? {nombre, valor: 0};
      acc.valor += (p.Monto ?? 0);
      metodoPagoMap.set(mpId, acc);
    }
    const resumenMetodoPago = Array.from(metodoPagoMap.values());
    const totalMetodoPago = resumenMetodoPago.reduce((s, m) => s + m.valor, 0);

    const ventasEfectivo = pagosDelDia
      .filter((p: any) => p.metodoPagoId === 1)
      .reduce((s: number, p: any) => s + (p.Monto ?? 0), 0);

    // --- Créditos del Día ---
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

    // --- Abonos del Día ---
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

    // --- Devoluciones ---
    const devolucionesDelDia = await this.devolucionRepository.find({
      where: {Fecha: {like: `${soloFecha}%`}},
      include: [{relation: 'venta'}],
    }) as Array<Devolucion & {venta?: {Precio?: number}}>;
    const totalReembolsos = devolucionesDelDia.reduce((s, d) => s + ((d.venta?.Precio ?? 0) * (d.Cantidad ?? 0)), 0);

    const cierresDelDia = await this.cierreCajaRepository.find({
      where: {FechaHoraApertura: {like: `${soloFecha}%`}},
    });
    const base = cierresDelDia.reduce((s, c) => s + (c.Base ?? 0), 0);
    const entregaCierre = cierresDelDia.reduce((s, c) => s + (c.Entrega ?? 0), 0);

    const efectivoEnCaja = ventasEfectivo + base - gastos - entrega - totalReembolsos;
    const quedaEnCaja = efectivoEnCaja - entregaCierre;

    return new EfectivoEnCaja({
      fecha: soloFecha,
      ventasEfectivo,
      base,
      gastos,
      entrega,
      efectivoEnCaja,
      quedaEnCaja,
      resumenVentas,
      totalVentas,
      totalZapatosVendidos,
      resumenMetodoPago,
      totalMetodoPago,
      detalleGastos,
      detalleEntregas,
      TotalReembolsos: totalReembolsos,
      devoluciones: -totalReembolsos,
      credito: -totalCreditos,
      abonos: totalAbonos,
    });
  }

  @patch('/cierre-caja')
  @response(200, {
    description: 'CierreCaja PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CierreCaja, {partial: true}),
        },
      },
    })
    cierreCaja: CierreCaja,
    @param.where(CierreCaja) where?: Where<CierreCaja>,
  ): Promise<Count> {
    return this.cierreCajaRepository.updateAll(cierreCaja, where);
  }

  @get('/cierre-caja/{id}')
  @response(200, {
    description: 'CierreCaja model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(CierreCaja, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(CierreCaja, {exclude: 'where'}) filter?: FilterExcludingWhere<CierreCaja>
  ): Promise<CierreCaja> {
    return this.cierreCajaRepository.findById(id, filter);
  }

  @patch('/cierre-caja/{id}')
  @response(204, {
    description: 'CierreCaja PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CierreCaja, {partial: true}),
        },
      },
    })
    cierreCaja: CierreCaja,
  ): Promise<void> {
    await this.cierreCajaRepository.updateById(id, cierreCaja);

    // Al cerrar la caja, registrar los totales por método de pago
    if (cierreCaja.Estado === 'Cerrada') {
      // Obtener la fecha del cierre para filtrar los pagos del día
      const cierre = await this.cierreCajaRepository.findById(id);
      const fechaApertura: any = cierre.FechaHoraApertura;
      let soloFecha = '';
      try {
        const d = fechaApertura ? new Date(fechaApertura) : new Date();
        const bogotaDate = new Date(d.toLocaleString('en-US', {timeZone: 'America/Bogota'}));
        const yyyy = bogotaDate.getFullYear();
        const mm = String(bogotaDate.getMonth() + 1).padStart(2, '0');
        const dd = String(bogotaDate.getDate()).padStart(2, '0');
        soloFecha = `${yyyy}-${mm}-${dd}`;
      } catch {
        const bogotaDate = new Date(new Date().toLocaleString('en-US', {timeZone: 'America/Bogota'}));
        soloFecha = bogotaDate.toISOString().slice(0, 10);
      }

      // Obtener las facturas del día
      const facturasDelDia = await this.facturaRepository.find({
        where: {Fecha: {like: `${soloFecha}%`}},
        fields: {id: true},
      });
      const facturaIds = facturasDelDia
        .map(f => f.id)
        .filter((fid): fid is number => typeof fid === 'number');

      // Obtener pagos del día con su método de pago
      const pagosDelDia = facturaIds.length > 0
        ? await this.pagoFacturaRepository.find({
            where: {facturaId: {inq: facturaIds}},
            include: [{relation: 'metodoPago'}],
          }) as any[]
        : [];

      // Agrupar totales por metodoPagoId
      const metodoPagoMap = new Map<number, number>();
      for (const p of pagosDelDia) {
        const mpId = p.metodoPagoId as number;
        const prev = metodoPagoMap.get(mpId) ?? 0;
        metodoPagoMap.set(mpId, prev + (p.Monto ?? 0));
      }

      // Eliminar registros anteriores de este cierre (para evitar duplicados en re-cierres)
      await this.cierreCajaMetodoPagoRepository.deleteAll({cierreCajaId: id});

      // Insertar un registro por cada método de pago
      for (const [mpId, total] of metodoPagoMap.entries()) {
        await this.cierreCajaMetodoPagoRepository.create(new CierreCajaMetodoPago({
          cierreCajaId: id,
          metodoPagoId: mpId,
          Total: total,
        }));
      }
    }
  }

  @put('/cierre-caja/{id}')
  @response(204, {
    description: 'CierreCaja PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() cierreCaja: CierreCaja,
  ): Promise<void> {
    await this.cierreCajaRepository.replaceById(id, cierreCaja);
  }

  @del('/cierre-caja/{id}')
  @response(204, {
    description: 'CierreCaja DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.cierreCajaRepository.deleteById(id);
  }

  // ===== IMPRESION =====

  @get('/cierre-caja/{id}/imprimir')
  @response(200, {
    description: 'Buffer ESC/POS del cierre de caja en Base64 (impresión local)',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {buffer: {type: 'string'}},
        },
      },
    },
  })
  async getBufferImpresionCierre(
    @param.path.number('id') id: number,
  ): Promise<{buffer: string}> {
    const buffer = await this.impresoraService.buildCierreCajaBuffer(id);
    return {buffer: buffer.toString('base64')};
  }

  @post('/cierre-caja/{id}/imprimir-servidor')
  @response(204, {
    description: 'Imprime el cierre de caja en la impresora del servidor',
  })
  async imprimirCierreEnServidor(
    @param.path.number('id') id: number,
  ): Promise<void> {
    await this.impresoraService.printCierreCaja({id});
  }

}
