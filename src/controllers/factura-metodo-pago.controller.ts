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
  MetodoPago,
} from '../models';
import {FacturaRepository} from '../repositories';

export class FacturaMetodoPagoController {
  constructor(
    @repository(FacturaRepository)
    public facturaRepository: FacturaRepository,
  ) { }

  @get('/facturas/{id}/metodo-pago', {
    responses: {
      '200': {
        description: 'MetodoPago belonging to Factura',
        content: {
          'application/json': {
            schema: getModelSchemaRef(MetodoPago),
          },
        },
      },
    },
  })
  async getMetodoPago(
    @param.path.number('id') id: typeof Factura.prototype.id,
  ): Promise<MetodoPago> {
    return this.facturaRepository.metodoPago(id);
  }
}
