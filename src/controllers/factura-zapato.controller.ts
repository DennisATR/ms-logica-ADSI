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
Zapato,
} from '../models';
import {FacturaRepository} from '../repositories';

export class FacturaZapatoController {
  constructor(
    @repository(FacturaRepository) protected facturaRepository: FacturaRepository,
  ) { }

  @get('/facturas/{id}/zapatoes', {
    responses: {
      '200': {
        description: 'Array of Factura has many Zapato through Venta',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Zapato)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<Zapato>,
  ): Promise<Zapato[]> {
    return this.facturaRepository.zapatos(id).find(filter);
  }

  @post('/facturas/{id}/zapatoes', {
    responses: {
      '200': {
        description: 'create a Zapato model instance',
        content: {'application/json': {schema: getModelSchemaRef(Zapato)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Factura.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Zapato, {
            title: 'NewZapatoInFactura',
            exclude: ['id'],
          }),
        },
      },
    }) zapato: Omit<Zapato, 'id'>,
  ): Promise<Zapato> {
    return this.facturaRepository.zapatos(id).create(zapato);
  }

  @patch('/facturas/{id}/zapatoes', {
    responses: {
      '200': {
        description: 'Factura.Zapato PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Zapato, {partial: true}),
        },
      },
    })
    zapato: Partial<Zapato>,
    @param.query.object('where', getWhereSchemaFor(Zapato)) where?: Where<Zapato>,
  ): Promise<Count> {
    return this.facturaRepository.zapatos(id).patch(zapato, where);
  }

  @del('/facturas/{id}/zapatoes', {
    responses: {
      '200': {
        description: 'Factura.Zapato DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(Zapato)) where?: Where<Zapato>,
  ): Promise<Count> {
    return this.facturaRepository.zapatos(id).delete(where);
  }
}
