import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  MetodoPago,
  CierreCajaMetodoPago,
} from '../models';
import {MetodoPagoRepository} from '../repositories';

export class MetodoPagoCierreCajaMetodoPagoController {
  constructor(
    @repository(MetodoPagoRepository) protected metodoPagoRepository: MetodoPagoRepository,
  ) { }

  @get('/metodo-pagos/{id}/cierre-caja-metodo-pagos', {
    responses: {
      '200': {
        description: 'Array of MetodoPago has many CierreCajaMetodoPago',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(CierreCajaMetodoPago)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<CierreCajaMetodoPago>,
  ): Promise<CierreCajaMetodoPago[]> {
    return this.metodoPagoRepository.cierreCajaMetodoPagos(id).find(filter);
  }

  @post('/metodo-pagos/{id}/cierre-caja-metodo-pagos', {
    responses: {
      '200': {
        description: 'MetodoPago model instance',
        content: {'application/json': {schema: getModelSchemaRef(CierreCajaMetodoPago)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof MetodoPago.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CierreCajaMetodoPago, {
            title: 'NewCierreCajaMetodoPagoInMetodoPago',
            exclude: ['id'],
            optional: ['metodoPagoId']
          }),
        },
      },
    }) cierreCajaMetodoPago: Omit<CierreCajaMetodoPago, 'id'>,
  ): Promise<CierreCajaMetodoPago> {
    return this.metodoPagoRepository.cierreCajaMetodoPagos(id).create(cierreCajaMetodoPago);
  }

  @patch('/metodo-pagos/{id}/cierre-caja-metodo-pagos', {
    responses: {
      '200': {
        description: 'MetodoPago.CierreCajaMetodoPago PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CierreCajaMetodoPago, {partial: true}),
        },
      },
    })
    cierreCajaMetodoPago: Partial<CierreCajaMetodoPago>,
    @param.query.object('where', getWhereSchemaFor(CierreCajaMetodoPago)) where?: Where<CierreCajaMetodoPago>,
  ): Promise<Count> {
    return this.metodoPagoRepository.cierreCajaMetodoPagos(id).patch(cierreCajaMetodoPago, where);
  }

  @del('/metodo-pagos/{id}/cierre-caja-metodo-pagos', {
    responses: {
      '200': {
        description: 'MetodoPago.CierreCajaMetodoPago DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(CierreCajaMetodoPago)) where?: Where<CierreCajaMetodoPago>,
  ): Promise<Count> {
    return this.metodoPagoRepository.cierreCajaMetodoPagos(id).delete(where);
  }
}
