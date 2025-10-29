import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Pago,
  Vendedor,
} from '../models';
import {PagoRepository} from '../repositories';

export class PagoVendedorController {
  constructor(
    @repository(PagoRepository)
    public pagoRepository: PagoRepository,
  ) { }

  @get('/pagos/{id}/vendedor', {
    responses: {
      '200': {
        description: 'Vendedor belonging to Pago',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Vendedor),
          },
        },
      },
    },
  })
  async getVendedor(
    @param.path.number('id') id: typeof Pago.prototype.id,
  ): Promise<Vendedor> {
    return this.pagoRepository.vendedor(id);
  }
}
