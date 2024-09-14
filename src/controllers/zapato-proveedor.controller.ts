import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Zapato,
  Proveedor,
} from '../models';
import {ZapatoRepository} from '../repositories';

export class ZapatoProveedorController {
  constructor(
    @repository(ZapatoRepository)
    public zapatoRepository: ZapatoRepository,
  ) { }

  @get('/zapatoes/{id}/proveedor', {
    responses: {
      '200': {
        description: 'Proveedor belonging to Zapato',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Proveedor),
          },
        },
      },
    },
  })
  async getProveedor(
    @param.path.number('id') id: typeof Zapato.prototype.id,
  ): Promise<Proveedor> {
    return this.zapatoRepository.proveedor(id);
  }
}
