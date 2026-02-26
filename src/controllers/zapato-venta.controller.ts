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
} from '../models';
import {ZapatoRepository} from '../repositories';

export class ZapatoVentaController {
  constructor(
    @repository(ZapatoRepository) protected zapatoRepository: ZapatoRepository,
  ) { }

  @get('/zapatoes/{id}/ventas', {
    responses: {
      '200': {
        description: 'Array of Zapato has many Venta',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Venta)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<Venta>,
  ): Promise<Venta[]> {
    return this.zapatoRepository.ventas(id).find(filter);
  }

  @post('/zapatoes/{id}/ventas', {
    responses: {
      '200': {
        description: 'Zapato model instance',
        content: {'application/json': {schema: getModelSchemaRef(Venta)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof Zapato.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Venta, {
            title: 'NewVentaInZapato',
            exclude: ['id'],
            optional: ['zapatoId']
          }),
        },
      },
    }) venta: Omit<Venta, 'id'>,
  ): Promise<Venta> {
    return this.zapatoRepository.ventas(id).create(venta);
  }

  @patch('/zapatoes/{id}/ventas', {
    responses: {
      '200': {
        description: 'Zapato.Venta PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
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
    return this.zapatoRepository.ventas(id).patch(venta, where);
  }

  @del('/zapatoes/{id}/ventas', {
    responses: {
      '200': {
        description: 'Zapato.Venta DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(Venta)) where?: Where<Venta>,
  ): Promise<Count> {
    return this.zapatoRepository.ventas(id).delete(where);
  }
}
