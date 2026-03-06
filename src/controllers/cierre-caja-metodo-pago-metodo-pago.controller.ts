import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  CierreCajaMetodoPago,
  MetodoPago,
} from '../models';
import {CierreCajaMetodoPagoRepository} from '../repositories';

export class CierreCajaMetodoPagoMetodoPagoController {
  constructor(
    @repository(CierreCajaMetodoPagoRepository)
    public cierreCajaMetodoPagoRepository: CierreCajaMetodoPagoRepository,
  ) { }

  @get('/cierre-caja-metodo-pagos/{id}/metodo-pago', {
    responses: {
      '200': {
        description: 'MetodoPago belonging to CierreCajaMetodoPago',
        content: {
          'application/json': {
            schema: getModelSchemaRef(MetodoPago),
          },
        },
      },
    },
  })
  async getMetodoPago(
    @param.path.number('id') id: typeof CierreCajaMetodoPago.prototype.id,
  ): Promise<MetodoPago> {
    return this.cierreCajaMetodoPagoRepository.metodoPago(id);
  }
}
