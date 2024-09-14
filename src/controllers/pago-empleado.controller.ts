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
  Empleado,
} from '../models';
import {PagoRepository} from '../repositories';

export class PagoEmpleadoController {
  constructor(
    @repository(PagoRepository)
    public pagoRepository: PagoRepository,
  ) { }

  @get('/pagos/{id}/empleado', {
    responses: {
      '200': {
        description: 'Empleado belonging to Pago',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Empleado),
          },
        },
      },
    },
  })
  async getEmpleado(
    @param.path.number('id') id: typeof Pago.prototype.id,
  ): Promise<Empleado> {
    return this.pagoRepository.empleado(id);
  }
}
