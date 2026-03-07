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
import {CierreCaja} from '../models';
import {CierreCajaRepository} from '../repositories';

export class CierreCajaController {
  constructor(
    @repository(CierreCajaRepository)
    public cierreCajaRepository: CierreCajaRepository,
  ) { }

  @post('/cierre-caja')
  @response(200, {
    description: 'CierreCaja model instance',
    content: {'application/json': {schema: getModelSchemaRef(CierreCaja)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CierreCaja, {
            title: 'NewCierreCaja',
            exclude: ['id', 'FechaHoraApertura', 'FechaHoraCierre'],
          }),
        },
      },
    })
    cierreCaja: Omit<CierreCaja, 'id'>,
  ): Promise<CierreCaja> {
    const fechaRegistro = new Date().toLocaleString('sv-SE', {timeZone: 'America/Bogota'});
    cierreCaja.FechaHoraApertura = fechaRegistro;
    return this.cierreCajaRepository.create(cierreCaja);
  }

  @get('/cierre-caja/count')
  @response(200, {
    description: 'CierreCaja model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(CierreCaja) where?: Where<CierreCaja>,
  ): Promise<Count> {
    return this.cierreCajaRepository.count(where);
  }

  @get('/cierre-caja')
  @response(200, {
    description: 'Array of CierreCaja model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CierreCaja, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(CierreCaja) filter?: Filter<CierreCaja>,
  ): Promise<CierreCaja[]> {
    return this.cierreCajaRepository.find(filter);
  }

  @patch('/cierre-caja')
  @response(200, {
    description: 'CierreCaja PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CierreCaja, {partial: true}),
        },
      },
    })
    cierreCaja: CierreCaja,
    @param.where(CierreCaja) where?: Where<CierreCaja>,
  ): Promise<Count> {
    return this.cierreCajaRepository.updateAll(cierreCaja, where);
  }

  @get('/cierre-caja/{id}')
  @response(200, {
    description: 'CierreCaja model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(CierreCaja, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(CierreCaja, {exclude: 'where'}) filter?: FilterExcludingWhere<CierreCaja>
  ): Promise<CierreCaja> {
    return this.cierreCajaRepository.findById(id, filter);
  }

  @patch('/cierre-caja/{id}')
  @response(204, {
    description: 'CierreCaja PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CierreCaja, {partial: true}),
        },
      },
    })
    cierreCaja: CierreCaja,
  ): Promise<void> {
    await this.cierreCajaRepository.updateById(id, cierreCaja);
  }

  @put('/cierre-caja/{id}')
  @response(204, {
    description: 'CierreCaja PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() cierreCaja: CierreCaja,
  ): Promise<void> {
    await this.cierreCajaRepository.replaceById(id, cierreCaja);
  }

  @del('/cierre-caja/{id}')
  @response(204, {
    description: 'CierreCaja DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.cierreCajaRepository.deleteById(id);
  }
}
