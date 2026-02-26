import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Venta,
  Factura,
} from '../models';
import {VentaRepository} from '../repositories';

export class VentaFacturaController {
  constructor(
    @repository(VentaRepository)
    public ventaRepository: VentaRepository,
  ) { }

  @get('/ventas/{id}/factura', {
    responses: {
      '200': {
        description: 'Factura belonging to Venta',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Factura),
          },
        },
      },
    },
  })
  async getFactura(
    @param.path.number('id') id: typeof Venta.prototype.id,
  ): Promise<Factura> {
    return this.ventaRepository.factura(id);
  }
}
