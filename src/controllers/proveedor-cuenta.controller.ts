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
  Cuenta,
} from '../models';
import {ProveedorRepository} from '../repositories';

export class ProveedorCuentaController {
  constructor(
    @repository(ProveedorRepository) protected proveedorRepository: ProveedorRepository,
  ) { }

  @get('/proveedors/{id}/cuentas', {
    responses: {
      '200': {
        description: 'Array of Proveedor has many Cuenta',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Cuenta)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<Cuenta>,
  ): Promise<Cuenta[]> {
    return this.proveedorRepository.cuentas(id).find(filter);
  }

  @post('/proveedors/{id}/cuentas', {
    responses: {
      '200': {
        description: 'Proveedor model instance',
        content: {'application/json': {schema: getModelSchemaRef(Cuenta)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Proveedor.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Cuenta, {
            title: 'NewCuentaInProveedor',
            exclude: ['id'],
            optional: ['proveedorId']
          }),
        },
      },
    }) cuenta: Omit<Cuenta, 'id'>,
  ): Promise<Cuenta> {
    return this.proveedorRepository.cuentas(id).create(cuenta);
  }

  @patch('/proveedors/{id}/cuentas', {
    responses: {
      '200': {
        description: 'Proveedor.Cuenta PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Cuenta, {partial: true}),
        },
      },
    })
    cuenta: Partial<Cuenta>,
    @param.query.object('where', getWhereSchemaFor(Cuenta)) where?: Where<Cuenta>,
  ): Promise<Count> {
    return this.proveedorRepository.cuentas(id).patch(cuenta, where);
  }

  @del('/proveedors/{id}/cuentas', {
    responses: {
      '200': {
        description: 'Proveedor.Cuenta DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(Cuenta)) where?: Where<Cuenta>,
  ): Promise<Count> {
    return this.proveedorRepository.cuentas(id).delete(where);
  }
}
