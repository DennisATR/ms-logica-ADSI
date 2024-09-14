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
import {Zapato} from '../models';
import {ZapatoRepository} from '../repositories';

export class ZapatoController {
  constructor(
    @repository(ZapatoRepository)
    public zapatoRepository : ZapatoRepository,
  ) {}

  @post('/zapato')
  @response(200, {
    description: 'Zapato model instance',
    content: {'application/json': {schema: getModelSchemaRef(Zapato)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Zapato, {
            title: 'NewZapato',
            exclude: ['id'],
          }),
        },
      },
    })
    zapato: Omit<Zapato, 'id'>,
  ): Promise<Zapato> {
    return this.zapatoRepository.create(zapato);
  }

  @get('/zapato/count')
  @response(200, {
    description: 'Zapato model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Zapato) where?: Where<Zapato>,
  ): Promise<Count> {
    return this.zapatoRepository.count(where);
  }

  @get('/zapato')
  @response(200, {
    description: 'Array of Zapato model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Zapato, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Zapato) filter?: Filter<Zapato>,
  ): Promise<Zapato[]> {
    return this.zapatoRepository.find(filter);
  }

  @patch('/zapato')
  @response(200, {
    description: 'Zapato PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Zapato, {partial: true}),
        },
      },
    })
    zapato: Zapato,
    @param.where(Zapato) where?: Where<Zapato>,
  ): Promise<Count> {
    return this.zapatoRepository.updateAll(zapato, where);
  }

  @get('/zapato/{id}')
  @response(200, {
    description: 'Zapato model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Zapato, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Zapato, {exclude: 'where'}) filter?: FilterExcludingWhere<Zapato>
  ): Promise<Zapato> {
    return this.zapatoRepository.findById(id, filter);
  }

  @patch('/zapato/{id}')
  @response(204, {
    description: 'Zapato PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Zapato, {partial: true}),
        },
      },
    })
    zapato: Zapato,
  ): Promise<void> {
    await this.zapatoRepository.updateById(id, zapato);
  }

  @put('/zapato/{id}')
  @response(204, {
    description: 'Zapato PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() zapato: Zapato,
  ): Promise<void> {
    await this.zapatoRepository.replaceById(id, zapato);
  }

  @del('/zapato/{id}')
  @response(204, {
    description: 'Zapato DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.zapatoRepository.deleteById(id);
  }
}
