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
import {Pendiente} from '../models';
import {PendienteRepository} from '../repositories';

export class PendienteController {
  constructor(
    @repository(PendienteRepository)
    public pendienteRepository : PendienteRepository,
  ) {}

  @post('/pendiente')
  @response(200, {
    description: 'Pendiente model instance',
    content: {'application/json': {schema: getModelSchemaRef(Pendiente)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Pendiente, {
            title: 'NewPendiente',
            exclude: ['id'],
          }),
        },
      },
    })
    pendiente: Omit<Pendiente, 'id'>,
  ): Promise<Pendiente> {
    return this.pendienteRepository.create(pendiente);
  }

  @get('/pendiente/count')
  @response(200, {
    description: 'Pendiente model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Pendiente) where?: Where<Pendiente>,
  ): Promise<Count> {
    return this.pendienteRepository.count(where);
  }

  @get('/pendiente')
  @response(200, {
    description: 'Array of Pendiente model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Pendiente, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Pendiente) filter?: Filter<Pendiente>,
  ): Promise<Pendiente[]> {
    return this.pendienteRepository.find(filter);
  }

  @patch('/pendiente')
  @response(200, {
    description: 'Pendiente PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Pendiente, {partial: true}),
        },
      },
    })
    pendiente: Pendiente,
    @param.where(Pendiente) where?: Where<Pendiente>,
  ): Promise<Count> {
    return this.pendienteRepository.updateAll(pendiente, where);
  }

  @get('/pendiente/{id}')
  @response(200, {
    description: 'Pendiente model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Pendiente, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Pendiente, {exclude: 'where'}) filter?: FilterExcludingWhere<Pendiente>
  ): Promise<Pendiente> {
    return this.pendienteRepository.findById(id, filter);
  }

  @patch('/pendiente/{id}')
  @response(204, {
    description: 'Pendiente PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Pendiente, {partial: true}),
        },
      },
    })
    pendiente: Pendiente,
  ): Promise<void> {
    await this.pendienteRepository.updateById(id, pendiente);
  }

  @put('/pendiente/{id}')
  @response(204, {
    description: 'Pendiente PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() pendiente: Pendiente,
  ): Promise<void> {
    await this.pendienteRepository.replaceById(id, pendiente);
  }

  @del('/pendiente/{id}')
  @response(204, {
    description: 'Pendiente DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.pendienteRepository.deleteById(id);
  }
}
