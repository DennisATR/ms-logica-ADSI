import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {Infolocal} from '../models';
import {InfolocalRepository} from '../repositories';

export class InfolocalController {
  constructor(
    @repository(InfolocalRepository)
    public infolocalRepository : InfolocalRepository,
  ) {}

  @post('/infolocal')
  @response(200, {
    description: 'Infolocal model instance',
    content: {'application/json': {schema: getModelSchemaRef(Infolocal)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Infolocal, {
            title: 'NewInfolocal',
            exclude: ['id'],
          }),
        },
      },
    })
    infolocal: Omit<Infolocal, 'id'>,
  ): Promise<Infolocal> {
      // Eliminar el registro anterior
    await this.infolocalRepository.deleteAll(); // Esto eliminará todos los registros
    return this.infolocalRepository.create(infolocal);
  }

  @get('/infolocal/count')
  @response(200, {
    description: 'Infolocal model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Infolocal) where?: Where<Infolocal>,
  ): Promise<Count> {
    return this.infolocalRepository.count(where);
  }

  @get('/infolocal')
  @response(200, {
    description: 'Array of Infolocal model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Infolocal, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Infolocal) filter?: Filter<Infolocal>,
  ): Promise<Infolocal[]> {
    return this.infolocalRepository.find(filter);
  }

  @patch('/infolocal')
  @response(200, {
    description: 'Infolocal PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Infolocal, {partial: true}),
        },
      },
    })
    infolocal: Infolocal,
    @param.where(Infolocal) where?: Where<Infolocal>,
  ): Promise<Count> {
    return this.infolocalRepository.updateAll(infolocal, where);
  }

  @get('/infolocal/{id}')
  @response(200, {
    description: 'Infolocal model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Infolocal, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Infolocal, {exclude: 'where'}) filter?: FilterExcludingWhere<Infolocal>
  ): Promise<Infolocal> {
    return this.infolocalRepository.findById(id, filter);
  }

  @patch('/infolocal/{id}')
  @response(204, {
    description: 'Infolocal PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Infolocal, {partial: true}),
        },
      },
    })
    infolocal: Infolocal,
  ): Promise<void> {
    await this.infolocalRepository.updateById(id, infolocal);
  }

  @put('/infolocal/{id}')
  @response(204, {
    description: 'Infolocal PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() infolocal: Infolocal,
  ): Promise<void> {
    await this.infolocalRepository.replaceById(id, infolocal);
  }

  @del('/infolocal/{id}')
  @response(204, {
    description: 'Infolocal DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.infolocalRepository.deleteById(id);
  }
}
