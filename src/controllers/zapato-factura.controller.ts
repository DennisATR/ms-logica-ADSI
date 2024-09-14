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
Zapato,
Venta,
Factura,
} from '../models';
import {ZapatoRepository} from '../repositories';

export class ZapatoFacturaController {
  constructor(
    @repository(ZapatoRepository) protected zapatoRepository: ZapatoRepository,
  ) { }

  @get('/zapatoes/{id}/facturas', {
    responses: {
      '200': {
        description: 'Array of Zapato has many Factura through Venta',
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
    return this.zapatoRepository.facturas(id).find(filter);
  }

  @post('/zapatoes/{id}/facturas', {
    responses: {
      '200': {
        description: 'create a Factura model instance',
        content: {'application/json': {schema: getModelSchemaRef(Factura)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Zapato.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Factura, {
            title: 'NewFacturaInZapato',
            exclude: ['id'],
          }),
        },
      },
    }) factura: Omit<Factura, 'id'>,
  ): Promise<Factura> {
    return this.zapatoRepository.facturas(id).create(factura);
  }

  @patch('/zapatoes/{id}/facturas', {
    responses: {
      '200': {
        description: 'Zapato.Factura PATCH success count',
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
    return this.zapatoRepository.facturas(id).patch(factura, where);
  }

  @del('/zapatoes/{id}/facturas', {
    responses: {
      '200': {
        description: 'Zapato.Factura DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(Factura)) where?: Where<Factura>,
  ): Promise<Count> {
    return this.zapatoRepository.facturas(id).delete(where);
  }
}
