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
import {CierreCajaMetodoPago} from '../models';
import {CierreCajaMetodoPagoRepository} from '../repositories';

export class CierreCajaMetodoPagoController {
  constructor(
    @repository(CierreCajaMetodoPagoRepository)
    public cierreCajaMetodoPagoRepository : CierreCajaMetodoPagoRepository,
  ) {}

  @post('/cierre-caja-metodo-pago')
  @response(200, {
    description: 'CierreCajaMetodoPago model instance',
    content: {'application/json': {schema: getModelSchemaRef(CierreCajaMetodoPago)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CierreCajaMetodoPago, {
            title: 'NewCierreCajaMetodoPago',
            exclude: ['id'],
          }),
        },
      },
    })
    cierreCajaMetodoPago: Omit<CierreCajaMetodoPago, 'id'>,
  ): Promise<CierreCajaMetodoPago> {
    return this.cierreCajaMetodoPagoRepository.create(cierreCajaMetodoPago);
  }

  @get('/cierre-caja-metodo-pago/count')
  @response(200, {
    description: 'CierreCajaMetodoPago model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(CierreCajaMetodoPago) where?: Where<CierreCajaMetodoPago>,
  ): Promise<Count> {
    return this.cierreCajaMetodoPagoRepository.count(where);
  }

  @get('/cierre-caja-metodo-pago')
  @response(200, {
    description: 'Array of CierreCajaMetodoPago model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CierreCajaMetodoPago, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(CierreCajaMetodoPago) filter?: Filter<CierreCajaMetodoPago>,
  ): Promise<CierreCajaMetodoPago[]> {
    return this.cierreCajaMetodoPagoRepository.find(filter);
  }

  @patch('/cierre-caja-metodo-pago')
  @response(200, {
    description: 'CierreCajaMetodoPago PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CierreCajaMetodoPago, {partial: true}),
        },
      },
    })
    cierreCajaMetodoPago: CierreCajaMetodoPago,
    @param.where(CierreCajaMetodoPago) where?: Where<CierreCajaMetodoPago>,
  ): Promise<Count> {
    return this.cierreCajaMetodoPagoRepository.updateAll(cierreCajaMetodoPago, where);
  }

  @get('/cierre-caja-metodo-pago/{id}')
  @response(200, {
    description: 'CierreCajaMetodoPago model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(CierreCajaMetodoPago, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(CierreCajaMetodoPago, {exclude: 'where'}) filter?: FilterExcludingWhere<CierreCajaMetodoPago>
  ): Promise<CierreCajaMetodoPago> {
    return this.cierreCajaMetodoPagoRepository.findById(id, filter);
  }

  @patch('/cierre-caja-metodo-pago/{id}')
  @response(204, {
    description: 'CierreCajaMetodoPago PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CierreCajaMetodoPago, {partial: true}),
        },
      },
    })
    cierreCajaMetodoPago: CierreCajaMetodoPago,
  ): Promise<void> {
    await this.cierreCajaMetodoPagoRepository.updateById(id, cierreCajaMetodoPago);
  }

  @put('/cierre-caja-metodo-pago/{id}')
  @response(204, {
    description: 'CierreCajaMetodoPago PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() cierreCajaMetodoPago: CierreCajaMetodoPago,
  ): Promise<void> {
    await this.cierreCajaMetodoPagoRepository.replaceById(id, cierreCajaMetodoPago);
  }

  @del('/cierre-caja-metodo-pago/{id}')
  @response(204, {
    description: 'CierreCajaMetodoPago DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.cierreCajaMetodoPagoRepository.deleteById(id);
  }
}
