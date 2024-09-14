import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Credito,
  Factura,
} from '../models';
import {CreditoRepository} from '../repositories';

export class CreditoFacturaController {
  constructor(
    @repository(CreditoRepository)
    public creditoRepository: CreditoRepository,
  ) { }

  @get('/creditos/{id}/factura', {
    responses: {
      '200': {
        description: 'Factura belonging to Credito',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Factura),
          },
        },
      },
    },
  })
  async getFactura(
    @param.path.number('id') id: typeof Credito.prototype.id,
  ): Promise<Factura> {
    return this.creditoRepository.factura(id);
  }
}
