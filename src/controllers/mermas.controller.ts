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
import {Mermas} from '../models';
import {MermasRepository} from '../repositories';

export class MermasController {
  constructor(
    @repository(MermasRepository)
    public mermasRepository: MermasRepository,
  ) { }

  @post('/mermas')
  @response(200, {
    description: 'Mermas model instance',
    content: {'application/json': {schema: getModelSchemaRef(Mermas)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Mermas, {
            title: 'NewMermas',
            exclude: ['id', 'Fecha'],
          }),
        },
      },
    })
    mermas: Omit<Mermas, 'id'>,
  ): Promise<Mermas> {
    const FechaRegistro = new Date().toLocaleString('sv-SE', {timeZone: 'America/Bogota'});
    mermas.Fecha = FechaRegistro;
    return this.mermasRepository.create(mermas);
  }

  @get('/mermas/count')
  @response(200, {
    description: 'Mermas model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Mermas) where?: Where<Mermas>,
  ): Promise<Count> {
    return this.mermasRepository.count(where);
  }

  @get('/mermas')
  @response(200, {
    description: 'Array of Mermas model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Mermas, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Mermas) filter?: Filter<Mermas>,
  ): Promise<Mermas[]> {
    return this.mermasRepository.find(filter);
  }

  @patch('/mermas')
  @response(200, {
    description: 'Mermas PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Mermas, {partial: true}),
        },
      },
    })
    mermas: Mermas,
    @param.where(Mermas) where?: Where<Mermas>,
  ): Promise<Count> {
    return this.mermasRepository.updateAll(mermas, where);
  }

  @get('/mermas/{id}')
  @response(200, {
    description: 'Mermas model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Mermas, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Mermas, {exclude: 'where'}) filter?: FilterExcludingWhere<Mermas>
  ): Promise<Mermas> {
    return this.mermasRepository.findById(id, filter);
  }

  @patch('/mermas/{id}')
  @response(204, {
    description: 'Mermas PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Mermas, {partial: true}),
        },
      },
    })
    mermas: Mermas,
  ): Promise<void> {
    await this.mermasRepository.updateById(id, mermas);
  }

  @put('/mermas/{id}')
  @response(204, {
    description: 'Mermas PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() mermas: Mermas,
  ): Promise<void> {
    await this.mermasRepository.replaceById(id, mermas);
  }

  @del('/mermas/{id}')
  @response(204, {
    description: 'Mermas DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.mermasRepository.deleteById(id);
  }
}
