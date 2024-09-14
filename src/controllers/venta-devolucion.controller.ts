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
  Devolucion,
} from '../models';
import {VentaRepository} from '../repositories';

export class VentaDevolucionController {
  constructor(
    @repository(VentaRepository) protected ventaRepository: VentaRepository,
  ) { }

  @get('/ventas/{id}/devolucions', {
    responses: {
      '200': {
        description: 'Array of Venta has many Devolucion',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Devolucion)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<Devolucion>,
  ): Promise<Devolucion[]> {
    return this.ventaRepository.devolucions(id).find(filter);
  }

  @post('/ventas/{id}/devolucions', {
    responses: {
      '200': {
        description: 'Venta model instance',
        content: {'application/json': {schema: getModelSchemaRef(Devolucion)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Venta.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Devolucion, {
            title: 'NewDevolucionInVenta',
            exclude: ['id'],
            optional: ['ventaId']
          }),
        },
      },
    }) devolucion: Omit<Devolucion, 'id'>,
  ): Promise<Devolucion> {
    return this.ventaRepository.devolucions(id).create(devolucion);
  }

  @patch('/ventas/{id}/devolucions', {
    responses: {
      '200': {
        description: 'Venta.Devolucion PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Devolucion, {partial: true}),
        },
      },
    })
    devolucion: Partial<Devolucion>,
    @param.query.object('where', getWhereSchemaFor(Devolucion)) where?: Where<Devolucion>,
  ): Promise<Count> {
    return this.ventaRepository.devolucions(id).patch(devolucion, where);
  }

  @del('/ventas/{id}/devolucions', {
    responses: {
      '200': {
        description: 'Venta.Devolucion DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(Devolucion)) where?: Where<Devolucion>,
  ): Promise<Count> {
    return this.ventaRepository.devolucions(id).delete(where);
  }
}
