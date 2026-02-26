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
  Almacen,
} from '../models';
import {VentaRepository} from '../repositories';

export class VentaAlmacenController {
  constructor(
    @repository(VentaRepository)
    public ventaRepository: VentaRepository,
  ) { }

  @get('/ventas/{id}/almacen', {
    responses: {
      '200': {
        description: 'Almacen belonging to Venta',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Almacen),
          },
        },
      },
    },
  })
  async getAlmacen(
    @param.path.number('id') id: typeof Venta.prototype.id,
  ): Promise<Almacen> {
    return this.ventaRepository.almacen(id);
  }
}
