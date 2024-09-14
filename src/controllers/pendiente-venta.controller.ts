import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Pendiente,
  Venta,
} from '../models';
import {PendienteRepository} from '../repositories';

export class PendienteVentaController {
  constructor(
    @repository(PendienteRepository)
    public pendienteRepository: PendienteRepository,
  ) { }

  @get('/pendientes/{id}/venta', {
    responses: {
      '200': {
        description: 'Venta belonging to Pendiente',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Venta),
          },
        },
      },
    },
  })
  async getVenta(
    @param.path.number('id') id: typeof Pendiente.prototype.id,
  ): Promise<Venta> {
    return this.pendienteRepository.venta(id);
  }
}
