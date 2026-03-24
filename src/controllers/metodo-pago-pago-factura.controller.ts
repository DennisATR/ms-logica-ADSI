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
  PagoFactura,
} from '../models';
import {MetodoPagoRepository} from '../repositories';

export class MetodoPagoPagoFacturaController {
  constructor(
    @repository(MetodoPagoRepository) protected metodoPagoRepository: MetodoPagoRepository,
  ) { }

  @get('/metodo-pagos/{id}/pago-facturas', {
    responses: {
      '200': {
        description: 'Array of MetodoPago has many PagoFactura',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(PagoFactura)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<PagoFactura>,
  ): Promise<PagoFactura[]> {
    return this.metodoPagoRepository.pagoFacturas(id).find(filter);
  }

  @post('/metodo-pagos/{id}/pago-facturas', {
    responses: {
      '200': {
        description: 'MetodoPago model instance',
        content: {'application/json': {schema: getModelSchemaRef(PagoFactura)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof MetodoPago.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PagoFactura, {
            title: 'NewPagoFacturaInMetodoPago',
            exclude: ['id'],
            optional: ['metodoPagoId']
          }),
        },
      },
    }) pagoFactura: Omit<PagoFactura, 'id'>,
  ): Promise<PagoFactura> {
    return this.metodoPagoRepository.pagoFacturas(id).create(pagoFactura);
  }

  @patch('/metodo-pagos/{id}/pago-facturas', {
    responses: {
      '200': {
        description: 'MetodoPago.PagoFactura PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PagoFactura, {partial: true}),
        },
      },
    })
    pagoFactura: Partial<PagoFactura>,
    @param.query.object('where', getWhereSchemaFor(PagoFactura)) where?: Where<PagoFactura>,
  ): Promise<Count> {
    return this.metodoPagoRepository.pagoFacturas(id).patch(pagoFactura, where);
  }

  @del('/metodo-pagos/{id}/pago-facturas', {
    responses: {
      '200': {
        description: 'MetodoPago.PagoFactura DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(PagoFactura)) where?: Where<PagoFactura>,
  ): Promise<Count> {
    return this.metodoPagoRepository.pagoFacturas(id).delete(where);
  }
}
