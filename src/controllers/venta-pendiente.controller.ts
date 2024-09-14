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
  Venta,
  Pendiente,
} from '../models';
import {VentaRepository} from '../repositories';

export class VentaPendienteController {
  constructor(
    @repository(VentaRepository) protected ventaRepository: VentaRepository,
  ) { }

  @get('/ventas/{id}/pendientes', {
    responses: {
      '200': {
        description: 'Array of Venta has many Pendiente',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Pendiente)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<Pendiente>,
  ): Promise<Pendiente[]> {
    return this.ventaRepository.pendientes(id).find(filter);
  }

  @post('/ventas/{id}/pendientes', {
    responses: {
      '200': {
        description: 'Venta model instance',
        content: {'application/json': {schema: getModelSchemaRef(Pendiente)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Venta.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Pendiente, {
            title: 'NewPendienteInVenta',
            exclude: ['id'],
            optional: ['ventaId']
          }),
        },
      },
    }) pendiente: Omit<Pendiente, 'id'>,
  ): Promise<Pendiente> {
    return this.ventaRepository.pendientes(id).create(pendiente);
  }

  @patch('/ventas/{id}/pendientes', {
    responses: {
      '200': {
        description: 'Venta.Pendiente PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Pendiente, {partial: true}),
        },
      },
    })
    pendiente: Partial<Pendiente>,
    @param.query.object('where', getWhereSchemaFor(Pendiente)) where?: Where<Pendiente>,
  ): Promise<Count> {
    return this.ventaRepository.pendientes(id).patch(pendiente, where);
  }

  @del('/ventas/{id}/pendientes', {
    responses: {
      '200': {
        description: 'Venta.Pendiente DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(Pendiente)) where?: Where<Pendiente>,
  ): Promise<Count> {
    return this.ventaRepository.pendientes(id).delete(where);
  }
}
