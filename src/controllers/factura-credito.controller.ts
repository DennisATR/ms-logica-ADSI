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
  Credito,
} from '../models';
import {FacturaRepository} from '../repositories';

export class FacturaCreditoController {
  constructor(
    @repository(FacturaRepository) protected facturaRepository: FacturaRepository,
  ) { }

  @get('/facturas/{id}/creditos', {
    responses: {
      '200': {
        description: 'Array of Factura has many Credito',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Credito)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<Credito>,
  ): Promise<Credito[]> {
    return this.facturaRepository.creditos(id).find(filter);
  }

  @post('/facturas/{id}/creditos', {
    responses: {
      '200': {
        description: 'Factura model instance',
        content: {'application/json': {schema: getModelSchemaRef(Credito)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Factura.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Credito, {
            title: 'NewCreditoInFactura',
            exclude: ['id'],
            optional: ['facturaId']
          }),
        },
      },
    }) credito: Omit<Credito, 'id'>,
  ): Promise<Credito> {
    return this.facturaRepository.creditos(id).create(credito);
  }

  @patch('/facturas/{id}/creditos', {
    responses: {
      '200': {
        description: 'Factura.Credito PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Credito, {partial: true}),
        },
      },
    })
    credito: Partial<Credito>,
    @param.query.object('where', getWhereSchemaFor(Credito)) where?: Where<Credito>,
  ): Promise<Count> {
    return this.facturaRepository.creditos(id).patch(credito, where);
  }

  @del('/facturas/{id}/creditos', {
    responses: {
      '200': {
        description: 'Factura.Credito DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(Credito)) where?: Where<Credito>,
  ): Promise<Count> {
    return this.facturaRepository.creditos(id).delete(where);
  }
}
