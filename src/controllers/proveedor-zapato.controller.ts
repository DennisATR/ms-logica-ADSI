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
  Proveedor,
  Zapato,
} from '../models';
import {ProveedorRepository} from '../repositories';

export class ProveedorZapatoController {
  constructor(
    @repository(ProveedorRepository) protected proveedorRepository: ProveedorRepository,
  ) { }

  @get('/proveedors/{id}/zapatoes', {
    responses: {
      '200': {
        description: 'Array of Proveedor has many Zapato',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Zapato)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<Zapato>,
  ): Promise<Zapato[]> {
    return this.proveedorRepository.zapatos(id).find(filter);
  }

  @post('/proveedors/{id}/zapatoes', {
    responses: {
      '200': {
        description: 'Proveedor model instance',
        content: {'application/json': {schema: getModelSchemaRef(Zapato)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Proveedor.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Zapato, {
            title: 'NewZapatoInProveedor',
            exclude: ['id'],
            optional: ['proveedorId']
          }),
        },
      },
    }) zapato: Omit<Zapato, 'id'>,
  ): Promise<Zapato> {
    return this.proveedorRepository.zapatos(id).create(zapato);
  }

  @patch('/proveedors/{id}/zapatoes', {
    responses: {
      '200': {
        description: 'Proveedor.Zapato PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Zapato, {partial: true}),
        },
      },
    })
    zapato: Partial<Zapato>,
    @param.query.object('where', getWhereSchemaFor(Zapato)) where?: Where<Zapato>,
  ): Promise<Count> {
    return this.proveedorRepository.zapatos(id).patch(zapato, where);
  }

  @del('/proveedors/{id}/zapatoes', {
    responses: {
      '200': {
        description: 'Proveedor.Zapato DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(Zapato)) where?: Where<Zapato>,
  ): Promise<Count> {
    return this.proveedorRepository.zapatos(id).delete(where);
  }
}
