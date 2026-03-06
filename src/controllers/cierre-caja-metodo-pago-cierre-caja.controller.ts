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
  CierreCaja,
} from '../models';
import {CierreCajaMetodoPagoRepository} from '../repositories';

export class CierreCajaMetodoPagoCierreCajaController {
  constructor(
    @repository(CierreCajaMetodoPagoRepository)
    public cierreCajaMetodoPagoRepository: CierreCajaMetodoPagoRepository,
  ) { }

  @get('/cierre-caja-metodo-pagos/{id}/cierre-caja', {
    responses: {
      '200': {
        description: 'CierreCaja belonging to CierreCajaMetodoPago',
        content: {
          'application/json': {
            schema: getModelSchemaRef(CierreCaja),
          },
        },
      },
    },
  })
  async getCierreCaja(
    @param.path.number('id') id: typeof CierreCajaMetodoPago.prototype.id,
  ): Promise<CierreCaja> {
    return this.cierreCajaMetodoPagoRepository.cierreCaja(id);
  }
}
