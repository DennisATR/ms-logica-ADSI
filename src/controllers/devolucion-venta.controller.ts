import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Devolucion,
  Venta,
} from '../models';
import {DevolucionRepository} from '../repositories';

export class DevolucionVentaController {
  constructor(
    @repository(DevolucionRepository)
    public devolucionRepository: DevolucionRepository,
  ) { }

  @get('/devolucions/{id}/venta', {
    responses: {
      '200': {
        description: 'Venta belonging to Devolucion',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Venta),
          },
        },
      },
    },
  })
  async getVenta(
    @param.path.number('id') id: typeof Devolucion.prototype.id,
  ): Promise<Venta> {
    return this.devolucionRepository.venta(id);
  }
}
