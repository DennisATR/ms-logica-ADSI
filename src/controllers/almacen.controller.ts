import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import {Almacen} from '../models';
import {AlmacenRepository} from '../repositories';

export class AlmacenController {
  constructor(
    @repository(AlmacenRepository)
    public almacenRepository : AlmacenRepository,
  ) {}

  @post('/almacenes')
  @response(200, {
    description: 'Almacen model instance',
    content: {'application/json': {schema: getModelSchemaRef(Almacen)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Almacen, {
            title: 'NewAlmacen',
            exclude: ['id'],
          }),
        },
      },
    })
    almacen: Omit<Almacen, 'id'>,
  ): Promise<Almacen> {
    return this.almacenRepository.create(almacen);
  }

  @get('/almacenes/count')
  @response(200, {
    description: 'Almacen model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Almacen) where?: Where<Almacen>,
  ): Promise<Count> {
    return this.almacenRepository.count(where);
  }

  @get('/almacenes')
  @response(200, {
    description: 'Array of Almacen model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Almacen, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Almacen) filter?: Filter<Almacen>,
  ): Promise<Almacen[]> {
    return this.almacenRepository.find(filter);
  }

  @patch('/almacenes')
  @response(200, {
    description: 'Almacen PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Almacen, {partial: true}),
        },
      },
    })
    almacen: Almacen,
    @param.where(Almacen) where?: Where<Almacen>,
  ): Promise<Count> {
    return this.almacenRepository.updateAll(almacen, where);
  }

  @get('/almacenes/{id}')
  @response(200, {
    description: 'Almacen model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Almacen, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Almacen, {exclude: 'where'}) filter?: FilterExcludingWhere<Almacen>
  ): Promise<Almacen> {
    return this.almacenRepository.findById(id, filter);
  }

  @patch('/almacenes/{id}')
  @response(204, {
    description: 'Almacen PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Almacen, {partial: true}),
        },
      },
    })
    almacen: Almacen,
  ): Promise<void> {
    await this.almacenRepository.updateById(id, almacen);
  }

  @put('/almacenes/{id}')
  @response(204, {
    description: 'Almacen PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() almacen: Almacen,
  ): Promise<void> {
    await this.almacenRepository.replaceById(id, almacen);
  }

  @del('/almacenes/{id}')
  @response(204, {
    description: 'Almacen DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.almacenRepository.deleteById(id);
  }
}
