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
import {Gastos} from '../models';
import {GastosRepository} from '../repositories';

export class GastosController {
  constructor(
    @repository(GastosRepository)
    public gastosRepository: GastosRepository,
  ) { }

  @post('/gastos')
  @response(200, {
    description: 'Gastos model instance',
    content: {'application/json': {schema: getModelSchemaRef(Gastos)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Gastos, {
            title: 'NewGastos',
            exclude: ['id'],
          }),
        },
      },
    })
    gastos: Omit<Gastos, 'id'>,
  ): Promise<Gastos> {
    return this.gastosRepository.create(gastos);
  }

  @get('/gastos/count')
  @response(200, {
    description: 'Gastos model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Gastos) where?: Where<Gastos>,
  ): Promise<Count> {
    return this.gastosRepository.count(where);
  }

  @get('/gastos')
  @response(200, {
    description: 'Array of Gastos model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Gastos, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Gastos) filter?: Filter<Gastos>,
  ): Promise<Gastos[]> {
    return this.gastosRepository.find(filter);
  }

  @patch('/gastos')
  @response(200, {
    description: 'Gastos PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Gastos, {partial: true}),
        },
      },
    })
    gastos: Gastos,
    @param.where(Gastos) where?: Where<Gastos>,
  ): Promise<Count> {
    return this.gastosRepository.updateAll(gastos, where);
  }

  @get('/gastos/{id}')
  @response(200, {
    description: 'Gastos model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Gastos, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Gastos, {exclude: 'where'}) filter?: FilterExcludingWhere<Gastos>
  ): Promise<Gastos> {
    return this.gastosRepository.findById(id, filter);
  }

  @patch('/gastos/{id}')
  @response(204, {
    description: 'Gastos PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Gastos, {partial: true}),
        },
      },
    })
    gastos: Gastos,
  ): Promise<void> {
    await this.gastosRepository.updateById(id, gastos);
  }

  @put('/gastos/{id}')
  @response(204, {
    description: 'Gastos PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() gastos: Gastos,
  ): Promise<void> {
    await this.gastosRepository.replaceById(id, gastos);
  }

  @del('/gastos/{id}')
  @response(204, {
    description: 'Gastos DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.gastosRepository.deleteById(id);
  }
}
