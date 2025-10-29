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
  Vendedor,
  Pago,
} from '../models';
import {VendedorRepository} from '../repositories';

export class VendedorPagoController {
  constructor(
    @repository(VendedorRepository) protected vendedorRepository: VendedorRepository,
  ) { }

  @get('/vendedors/{id}/pagos', {
    responses: {
      '200': {
        description: 'Array of Vendedor has many Pago',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Pago)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<Pago>,
  ): Promise<Pago[]> {
    return this.vendedorRepository.pagos(id).find(filter);
  }

  @post('/vendedors/{id}/pagos', {
    responses: {
      '200': {
        description: 'Vendedor model instance',
        content: {'application/json': {schema: getModelSchemaRef(Pago)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof Vendedor.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Pago, {
            title: 'NewPagoInVendedor',
            exclude: ['id'],
            optional: ['vendedorId']
          }),
        },
      },
    }) pago: Omit<Pago, 'id'>,
  ): Promise<Pago> {
    return this.vendedorRepository.pagos(id).create(pago);
  }

  @patch('/vendedors/{id}/pagos', {
    responses: {
      '200': {
        description: 'Vendedor.Pago PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Pago, {partial: true}),
        },
      },
    })
    pago: Partial<Pago>,
    @param.query.object('where', getWhereSchemaFor(Pago)) where?: Where<Pago>,
  ): Promise<Count> {
    return this.vendedorRepository.pagos(id).patch(pago, where);
  }

  @del('/vendedors/{id}/pagos', {
    responses: {
      '200': {
        description: 'Vendedor.Pago DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(Pago)) where?: Where<Pago>,
  ): Promise<Count> {
    return this.vendedorRepository.pagos(id).delete(where);
  }
}
