import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Factura,
  Vendedor,
} from '../models';
import {FacturaRepository} from '../repositories';

export class FacturaVendedorController {
  constructor(
    @repository(FacturaRepository)
    public facturaRepository: FacturaRepository,
  ) { }

  @get('/facturas/{id}/vendedor', {
    responses: {
      '200': {
        description: 'Vendedor belonging to Factura',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Vendedor),
          },
        },
      },
    },
  })
  async getVendedor(
    @param.path.number('id') id: typeof Factura.prototype.id,
  ): Promise<Vendedor> {
    return this.facturaRepository.vendedor(id);
  }
}
