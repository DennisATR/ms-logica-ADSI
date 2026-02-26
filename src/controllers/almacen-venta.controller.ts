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
  Almacen,
  Venta,
} from '../models';
import {AlmacenRepository} from '../repositories';

export class AlmacenVentaController {
  constructor(
    @repository(AlmacenRepository) protected almacenRepository: AlmacenRepository,
  ) { }

  @get('/almacens/{id}/ventas', {
    responses: {
      '200': {
        description: 'Array of Almacen has many Venta',
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
    return this.almacenRepository.ventas(id).find(filter);
  }

  @post('/almacens/{id}/ventas', {
    responses: {
      '200': {
        description: 'Almacen model instance',
        content: {'application/json': {schema: getModelSchemaRef(Venta)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Almacen.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Venta, {
            title: 'NewVentaInAlmacen',
            exclude: ['id'],
            optional: ['almacenId']
          }),
        },
      },
    }) venta: Omit<Venta, 'id'>,
  ): Promise<Venta> {
    return this.almacenRepository.ventas(id).create(venta);
  }

  @patch('/almacens/{id}/ventas', {
    responses: {
      '200': {
        description: 'Almacen.Venta PATCH success count',
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
    return this.almacenRepository.ventas(id).patch(venta, where);
  }

  @del('/almacens/{id}/ventas', {
    responses: {
      '200': {
        description: 'Almacen.Venta DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(Venta)) where?: Where<Venta>,
  ): Promise<Count> {
    return this.almacenRepository.ventas(id).delete(where);
  }
}
