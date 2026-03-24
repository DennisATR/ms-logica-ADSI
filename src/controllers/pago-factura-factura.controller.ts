import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  PagoFactura,
  Factura,
} from '../models';
import {PagoFacturaRepository} from '../repositories';

export class PagoFacturaFacturaController {
  constructor(
    @repository(PagoFacturaRepository)
    public pagoFacturaRepository: PagoFacturaRepository,
  ) { }

  @get('/pago-facturas/{id}/factura', {
    responses: {
      '200': {
        description: 'Factura belonging to PagoFactura',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Factura),
          },
        },
      },
    },
  })
  async getFactura(
    @param.path.number('id') id: typeof PagoFactura.prototype.id,
  ): Promise<Factura> {
    return this.pagoFacturaRepository.factura(id);
  }
}
