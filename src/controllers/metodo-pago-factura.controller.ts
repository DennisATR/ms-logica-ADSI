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
  MetodoPago,
  Factura,
} from '../models';
import {MetodoPagoRepository} from '../repositories';

export class MetodoPagoFacturaController {
  constructor(
    @repository(MetodoPagoRepository) protected metodoPagoRepository: MetodoPagoRepository,
  ) { }

  @get('/metodo-pagos/{id}/facturas', {
    responses: {
      '200': {
        description: 'Array of MetodoPago has many Factura',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Factura)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<Factura>,
  ): Promise<Factura[]> {
    return this.metodoPagoRepository.facturas(id).find(filter);
  }

  @post('/metodo-pagos/{id}/facturas', {
    responses: {
      '200': {
        description: 'MetodoPago model instance',
        content: {'application/json': {schema: getModelSchemaRef(Factura)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof MetodoPago.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Factura, {
            title: 'NewFacturaInMetodoPago',
            exclude: ['id'],
            optional: ['metodoPagoId']
          }),
        },
      },
    }) factura: Omit<Factura, 'id'>,
  ): Promise<Factura> {
    return this.metodoPagoRepository.facturas(id).create(factura);
  }

  @patch('/metodo-pagos/{id}/facturas', {
    responses: {
      '200': {
        description: 'MetodoPago.Factura PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Factura, {partial: true}),
        },
      },
    })
    factura: Partial<Factura>,
    @param.query.object('where', getWhereSchemaFor(Factura)) where?: Where<Factura>,
  ): Promise<Count> {
    return this.metodoPagoRepository.facturas(id).patch(factura, where);
  }

  @del('/metodo-pagos/{id}/facturas', {
    responses: {
      '200': {
        description: 'MetodoPago.Factura DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(Factura)) where?: Where<Factura>,
  ): Promise<Count> {
    return this.metodoPagoRepository.facturas(id).delete(where);
  }
}
