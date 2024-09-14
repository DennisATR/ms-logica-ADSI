import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Cuenta,
  Proveedor,
} from '../models';
import {CuentaRepository} from '../repositories';

export class CuentaProveedorController {
  constructor(
    @repository(CuentaRepository)
    public cuentaRepository: CuentaRepository,
  ) { }

  @get('/cuentas/{id}/proveedor', {
    responses: {
      '200': {
        description: 'Proveedor belonging to Cuenta',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Proveedor),
          },
        },
      },
    },
  })
  async getProveedor(
    @param.path.number('id') id: typeof Cuenta.prototype.id,
  ): Promise<Proveedor> {
    return this.cuentaRepository.proveedor(id);
  }
}
