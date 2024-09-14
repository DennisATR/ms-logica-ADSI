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
import {Devolucion} from '../models';
import {DevolucionRepository} from '../repositories';

export class DevolucionController {
  constructor(
    @repository(DevolucionRepository)
    public devolucionRepository : DevolucionRepository,
  ) {}

  @post('/devolucion')
  @response(200, {
    description: 'Devolucion model instance',
    content: {'application/json': {schema: getModelSchemaRef(Devolucion)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Devolucion, {
            title: 'NewDevolucion',
            exclude: ['id'],
          }),
        },
      },
    })
    devolucion: Omit<Devolucion, 'id'>,
  ): Promise<Devolucion> {
    return this.devolucionRepository.create(devolucion);
  }

  @get('/devolucion/count')
  @response(200, {
    description: 'Devolucion model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Devolucion) where?: Where<Devolucion>,
  ): Promise<Count> {
    return this.devolucionRepository.count(where);
  }

  @get('/devolucion')
  @response(200, {
    description: 'Array of Devolucion model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Devolucion, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Devolucion) filter?: Filter<Devolucion>,
  ): Promise<Devolucion[]> {
    return this.devolucionRepository.find(filter);
  }

  @patch('/devolucion')
  @response(200, {
    description: 'Devolucion PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Devolucion, {partial: true}),
        },
      },
    })
    devolucion: Devolucion,
    @param.where(Devolucion) where?: Where<Devolucion>,
  ): Promise<Count> {
    return this.devolucionRepository.updateAll(devolucion, where);
  }

  @get('/devolucion/{id}')
  @response(200, {
    description: 'Devolucion model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Devolucion, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Devolucion, {exclude: 'where'}) filter?: FilterExcludingWhere<Devolucion>
  ): Promise<Devolucion> {
    return this.devolucionRepository.findById(id, filter);
  }

  @patch('/devolucion/{id}')
  @response(204, {
    description: 'Devolucion PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Devolucion, {partial: true}),
        },
      },
    })
    devolucion: Devolucion,
  ): Promise<void> {
    await this.devolucionRepository.updateById(id, devolucion);
  }

  @put('/devolucion/{id}')
  @response(204, {
    description: 'Devolucion PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() devolucion: Devolucion,
  ): Promise<void> {
    await this.devolucionRepository.replaceById(id, devolucion);
  }

  @del('/devolucion/{id}')
  @response(204, {
    description: 'Devolucion DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.devolucionRepository.deleteById(id);
  }
}
