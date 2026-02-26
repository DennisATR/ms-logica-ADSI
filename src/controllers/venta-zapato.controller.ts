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
  Zapato,
} from '../models';
import {VentaRepository} from '../repositories';

export class VentaZapatoController {
  constructor(
    @repository(VentaRepository)
    public ventaRepository: VentaRepository,
  ) { }

  @get('/ventas/{id}/zapato', {
    responses: {
      '200': {
        description: 'Zapato belonging to Venta',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Zapato),
          },
        },
      },
    },
  })
  async getZapato(
    @param.path.number('id') id: typeof Venta.prototype.id,
  ): Promise<Zapato> {
    return this.ventaRepository.zapato(id);
  }
}
