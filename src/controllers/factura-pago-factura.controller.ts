import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  Factura,
  PagoFactura,
} from '../models';
import {FacturaRepository} from '../repositories';

export class FacturaPagoFacturaController {
  constructor(
    @repository(FacturaRepository) protected facturaRepository: FacturaRepository,
  ) { }

  @get('/facturas/{id}/pago-facturas', {
    responses: {
      '200': {
        description: 'Array of Factura has many PagoFactura',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(PagoFactura)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<PagoFactura>,
  ): Promise<PagoFactura[]> {
    return this.facturaRepository.pagoFacturas(id).find(filter);
  }

  @post('/facturas/{id}/pago-facturas', {
    responses: {
      '200': {
        description: 'Factura model instance',
        content: {'application/json': {schema: getModelSchemaRef(PagoFactura)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Factura.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PagoFactura, {
            title: 'NewPagoFacturaInFactura',
            exclude: ['id'],
            optional: ['facturaId']
          }),
        },
      },
    }) pagoFactura: Omit<PagoFactura, 'id'>,
  ): Promise<PagoFactura> {
    return this.facturaRepository.pagoFacturas(id).create(pagoFactura);
  }

  @patch('/facturas/{id}/pago-facturas', {
    responses: {
      '200': {
        description: 'Factura.PagoFactura PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PagoFactura, {partial: true}),
        },
      },
    })
    pagoFactura: Partial<PagoFactura>,
    @param.query.object('where', getWhereSchemaFor(PagoFactura)) where?: Where<PagoFactura>,
  ): Promise<Count> {
    return this.facturaRepository.pagoFacturas(id).patch(pagoFactura, where);
  }

  @del('/facturas/{id}/pago-facturas', {
    responses: {
      '200': {
        description: 'Factura.PagoFactura DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(PagoFactura)) where?: Where<PagoFactura>,
  ): Promise<Count> {
    return this.facturaRepository.pagoFacturas(id).delete(where);
  }
}
