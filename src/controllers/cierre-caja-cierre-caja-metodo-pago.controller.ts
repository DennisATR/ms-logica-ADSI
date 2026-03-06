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
  CierreCaja,
  CierreCajaMetodoPago,
} from '../models';
import {CierreCajaRepository} from '../repositories';

export class CierreCajaCierreCajaMetodoPagoController {
  constructor(
    @repository(CierreCajaRepository) protected cierreCajaRepository: CierreCajaRepository,
  ) { }

  @get('/cierre-cajas/{id}/cierre-caja-metodo-pagos', {
    responses: {
      '200': {
        description: 'Array of CierreCaja has many CierreCajaMetodoPago',
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
    return this.cierreCajaRepository.cierreCajaMetodoPagos(id).find(filter);
  }

  @post('/cierre-cajas/{id}/cierre-caja-metodo-pagos', {
    responses: {
      '200': {
        description: 'CierreCaja model instance',
        content: {'application/json': {schema: getModelSchemaRef(CierreCajaMetodoPago)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof CierreCaja.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CierreCajaMetodoPago, {
            title: 'NewCierreCajaMetodoPagoInCierreCaja',
            exclude: ['id'],
            optional: ['cierreCajaId']
          }),
        },
      },
    }) cierreCajaMetodoPago: Omit<CierreCajaMetodoPago, 'id'>,
  ): Promise<CierreCajaMetodoPago> {
    return this.cierreCajaRepository.cierreCajaMetodoPagos(id).create(cierreCajaMetodoPago);
  }

  @patch('/cierre-cajas/{id}/cierre-caja-metodo-pagos', {
    responses: {
      '200': {
        description: 'CierreCaja.CierreCajaMetodoPago PATCH success count',
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
    return this.cierreCajaRepository.cierreCajaMetodoPagos(id).patch(cierreCajaMetodoPago, where);
  }

  @del('/cierre-cajas/{id}/cierre-caja-metodo-pagos', {
    responses: {
      '200': {
        description: 'CierreCaja.CierreCajaMetodoPago DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(CierreCajaMetodoPago)) where?: Where<CierreCajaMetodoPago>,
  ): Promise<Count> {
    return this.cierreCajaRepository.cierreCajaMetodoPagos(id).delete(where);
  }
}
