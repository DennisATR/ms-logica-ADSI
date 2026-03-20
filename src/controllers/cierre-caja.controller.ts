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
import {CierreCaja, EfectivoEnCaja} from '../models';
import {
  CierreCajaRepository,
  EntregaRepository,
  FacturaRepository,
  GastosRepository,
} from '../repositories';

export class CierreCajaController {
  constructor(
    @repository(CierreCajaRepository)
    public cierreCajaRepository: CierreCajaRepository,
    @repository(FacturaRepository)
    public facturaRepository: FacturaRepository,
    @repository(GastosRepository)
    public gastosRepository: GastosRepository,
    @repository(EntregaRepository)
    public entregaRepository: EntregaRepository,
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

    const facturasEfectivoDelDia = await this.facturaRepository.find({
      where: {
        Fecha: {like: `${soloFecha}%`},
        metodoPagoId: 1,
      },
      fields: {
        Total: true,
      },
    });

    const cierresDelDia = await this.cierreCajaRepository.find({
      where: {
        FechaHoraApertura: {like: `${soloFecha}%`},
      },
      fields: {
        Base: true,
        Entrega: true,
      },
    });

    const gastosDelDia = await this.gastosRepository.find({
      where: {
        Fecha: {like: `${soloFecha}%`},
      },
      fields: {
        Valor: true,
      },
    });

    const entregasDelDia = await this.entregaRepository.find({
      where: {
        Fecha: {like: `${soloFecha}%`},
      },
      fields: {
        Cobro: true,
      },
    });

    const ventasEfectivo = facturasEfectivoDelDia.reduce(
      (acumulado, factura) => acumulado + (factura.Total ?? 0),
      0,
    );

    const base = cierresDelDia.reduce(
      (acumulado, cierre) => acumulado + (cierre.Base ?? 0),
      0,
    );

    const gastos = gastosDelDia.reduce(
      (acumulado, gasto) => acumulado + (gasto.Valor ?? 0),
      0,
    );

    const entrega = entregasDelDia.reduce(
      (acumulado, entregaDia) => acumulado + (entregaDia.Cobro ?? 0),
      0,
    );

    const efectivoEnCaja = ventasEfectivo + base - gastos - entrega;

    const entregaCierreCaja = cierresDelDia.reduce(
      (acumulado, cierre) => acumulado + (cierre.Entrega ?? 0),
      0,
    );

    const quedaEnCaja = efectivoEnCaja - entregaCierreCaja;


    return new EfectivoEnCaja({
      fecha: soloFecha,
      ventasEfectivo,
      base,
      gastos,
      entrega,
      efectivoEnCaja,
      quedaEnCaja,
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

}
