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
import {PagoFactura} from '../models';
import {CreditoRepository, FacturaRepository, PagoFacturaRepository} from '../repositories';

export class PagoFacturaController {
  constructor(
    @repository(PagoFacturaRepository)
    public pagoFacturaRepository: PagoFacturaRepository,
    @repository(CreditoRepository)
    public creditoRepository: CreditoRepository,
    @repository(FacturaRepository)
    public facturaRepository: FacturaRepository,
  ) { }

  @post('/pago-factura')
  @response(200, {
    description: 'PagoFactura model instance',
    content: {'application/json': {schema: getModelSchemaRef(PagoFactura)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PagoFactura, {
            title: 'NewPagoFactura',
            exclude: ['id', 'Fecha', 'Cambio'],
          }),
        },
      },
    })
    pagoFactura: Omit<PagoFactura, 'id'>,
  ): Promise<PagoFactura> {
    pagoFactura.Cambio = (pagoFactura.MontoRecibido ?? 0) - pagoFactura.Monto;
    pagoFactura.Fecha = new Date().toLocaleString('sv-SE', {timeZone: 'America/Bogota'});
    const nuevoPago = await this.pagoFacturaRepository.create(pagoFactura);

    // === Auto-cierre de crédito ===
    // Si la factura tiene un crédito asociado, verificamos si el saldo quedó en 0
    try {
      const facturaId = pagoFactura.facturaId ?? (pagoFactura as any).FacturaId;
      if (facturaId) {
        const factura = await this.facturaRepository.findById(facturaId, {
          include: [{relation: 'pagoFacturas'}],
        }) as any;

        const totalAbonado = (factura.pagoFacturas ?? []).reduce(
          (s: number, p: any) => s + (p.Monto ?? 0),
          0,
        );
        const saldoPendiente = (factura.Total ?? 0) - totalAbonado;

        if (saldoPendiente <= 0) {
          // Buscar el crédito asociado a esta factura y marcarlo como Pagado
          const creditos = await this.creditoRepository.find({
            where: {facturaId: facturaId},
          });
          for (const credito of creditos) {
            if (credito.Estado !== 'Pagado') {
              await this.creditoRepository.updateById(credito.id!, {Estado: 'Pagado'} as any);
            }
          }
        }
      }
    } catch (e) {
      // No interrumpir el flujo si falla el auto-cierre
      console.error('[PagoFactura] Error al intentar cerrar crédito automáticamente:', e);
    }

    return nuevoPago;
  }

  @get('/pago-factura/count')
  @response(200, {
    description: 'PagoFactura model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(PagoFactura) where?: Where<PagoFactura>,
  ): Promise<Count> {
    return this.pagoFacturaRepository.count(where);
  }

  @get('/pago-factura')
  @response(200, {
    description: 'Array of PagoFactura model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(PagoFactura, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(PagoFactura) filter?: Filter<PagoFactura>,
  ): Promise<PagoFactura[]> {
    return this.pagoFacturaRepository.find(filter);
  }

  @patch('/pago-factura')
  @response(200, {
    description: 'PagoFactura PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PagoFactura, {partial: true}),
        },
      },
    })
    pagoFactura: PagoFactura,
    @param.where(PagoFactura) where?: Where<PagoFactura>,
  ): Promise<Count> {
    return this.pagoFacturaRepository.updateAll(pagoFactura, where);
  }

  @get('/pago-factura/{id}')
  @response(200, {
    description: 'PagoFactura model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(PagoFactura, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(PagoFactura, {exclude: 'where'}) filter?: FilterExcludingWhere<PagoFactura>
  ): Promise<PagoFactura> {
    return this.pagoFacturaRepository.findById(id, filter);
  }

  @patch('/pago-factura/{id}')
  @response(204, {
    description: 'PagoFactura PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PagoFactura, {partial: true}),
        },
      },
    })
    pagoFactura: PagoFactura,
  ): Promise<void> {
    await this.pagoFacturaRepository.updateById(id, pagoFactura);
  }

  @put('/pago-factura/{id}')
  @response(204, {
    description: 'PagoFactura PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() pagoFactura: PagoFactura,
  ): Promise<void> {
    await this.pagoFacturaRepository.replaceById(id, pagoFactura);
  }

  @del('/pago-factura/{id}')
  @response(204, {
    description: 'PagoFactura DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.pagoFacturaRepository.deleteById(id);
  }


  @get('/pago-factura/factura/{id}')
  @response(200, {
    description: 'Array of PagoFactura model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(PagoFactura, {includeRelations: true}),
        },
      },
    },
  })
  async findByFacturaId(
    @param.path.number('id') id: number
  ): Promise<PagoFactura[]> {
    return this.pagoFacturaRepository.find({
      where: {FacturaId: id} as Where<PagoFactura>,
    });
  }

}
