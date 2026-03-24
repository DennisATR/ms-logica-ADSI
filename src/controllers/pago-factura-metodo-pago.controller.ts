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
  MetodoPago,
} from '../models';
import {PagoFacturaRepository} from '../repositories';

export class PagoFacturaMetodoPagoController {
  constructor(
    @repository(PagoFacturaRepository)
    public pagoFacturaRepository: PagoFacturaRepository,
  ) { }

  @get('/pago-facturas/{id}/metodo-pago', {
    responses: {
      '200': {
        description: 'MetodoPago belonging to PagoFactura',
        content: {
          'application/json': {
            schema: getModelSchemaRef(MetodoPago),
          },
        },
      },
    },
  })
  async getMetodoPago(
    @param.path.number('id') id: typeof PagoFactura.prototype.id,
  ): Promise<MetodoPago> {
    return this.pagoFacturaRepository.metodoPago(id);
  }
}
