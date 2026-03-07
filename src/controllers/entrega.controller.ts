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
import {Entrega} from '../models';
import {EntregaRepository} from '../repositories';

export class EntregaController {
  constructor(
    @repository(EntregaRepository)
    public entregaRepository: EntregaRepository,
  ) { }

  @post('/entrega')
  @response(200, {
    description: 'Entrega model instance',
    content: {'application/json': {schema: getModelSchemaRef(Entrega)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Entrega, {
            title: 'NewEntrega',
            exclude: ['id'],
          }),
        },
      },
    })
    entrega: Omit<Entrega, 'id'>,
  ): Promise<Entrega> {
    if (entrega.Fecha) {
      entrega.Fecha = new Date(entrega.Fecha)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');
    }
    return this.entregaRepository.create(entrega);
  }

  @get('/entrega/count')
  @response(200, {
    description: 'Entrega model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Entrega) where?: Where<Entrega>,
  ): Promise<Count> {
    return this.entregaRepository.count(where);
  }

  @get('/entrega')
  @response(200, {
    description: 'Array of Entrega model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Entrega, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Entrega) filter?: Filter<Entrega>,
  ): Promise<Entrega[]> {
    return this.entregaRepository.find(filter);
  }

  @patch('/entrega')
  @response(200, {
    description: 'Entrega PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Entrega, {partial: true}),
        },
      },
    })
    entrega: Entrega,
    @param.where(Entrega) where?: Where<Entrega>,
  ): Promise<Count> {
    return this.entregaRepository.updateAll(entrega, where);
  }

  @get('/entrega/{id}')
  @response(200, {
    description: 'Entrega model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Entrega, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Entrega, {exclude: 'where'}) filter?: FilterExcludingWhere<Entrega>
  ): Promise<Entrega> {
    return this.entregaRepository.findById(id, filter);
  }

  @patch('/entrega/{id}')
  @response(204, {
    description: 'Entrega PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Entrega, {partial: true}),
        },
      },
    })
    entrega: Entrega,
  ): Promise<void> {
    await this.entregaRepository.updateById(id, entrega);
  }

  @put('/entrega/{id}')
  @response(204, {
    description: 'Entrega PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() entrega: Entrega,
  ): Promise<void> {
    await this.entregaRepository.replaceById(id, entrega);
  }

  @del('/entrega/{id}')
  @response(204, {
    description: 'Entrega DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.entregaRepository.deleteById(id);
  }
}
