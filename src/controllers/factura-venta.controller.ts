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
  Venta,
} from '../models';
import {FacturaRepository} from '../repositories';

export class FacturaVentaController {
  constructor(
    @repository(FacturaRepository) protected facturaRepository: FacturaRepository,
  ) { }

  @get('/facturas/{id}/ventas', {
    responses: {
      '200': {
        description: 'Array of Factura has many Venta',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Venta)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<Venta>,
  ): Promise<Venta[]> {
    return this.facturaRepository.ventas(id).find(filter);
  }

  @post('/facturas/{id}/ventas', {
    responses: {
      '200': {
        description: 'Factura model instance',
        content: {'application/json': {schema: getModelSchemaRef(Venta)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Factura.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Venta, {
            title: 'NewVentaInFactura',
            exclude: ['id'],
            optional: ['facturaId']
          }),
        },
      },
    }) venta: Omit<Venta, 'id'>,
  ): Promise<Venta> {
    return this.facturaRepository.ventas(id).create(venta);
  }

  @patch('/facturas/{id}/ventas', {
    responses: {
      '200': {
        description: 'Factura.Venta PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Venta, {partial: true}),
        },
      },
    })
    venta: Partial<Venta>,
    @param.query.object('where', getWhereSchemaFor(Venta)) where?: Where<Venta>,
  ): Promise<Count> {
    return this.facturaRepository.ventas(id).patch(venta, where);
  }

  @del('/facturas/{id}/ventas', {
    responses: {
      '200': {
        description: 'Factura.Venta DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(Venta)) where?: Where<Venta>,
  ): Promise<Count> {
    return this.facturaRepository.ventas(id).delete(where);
  }
}
