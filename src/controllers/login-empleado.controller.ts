import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Login,
  Empleado,
} from '../models';
import {LoginRepository} from '../repositories';

export class LoginEmpleadoController {
  constructor(
    @repository(LoginRepository)
    public loginRepository: LoginRepository,
  ) { }

  @get('/logins/{id}/empleado', {
    responses: {
      '200': {
        description: 'Empleado belonging to Login',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Empleado),
          },
        },
      },
    },
  })
  async getEmpleado(
    @param.path.number('id') id: typeof Login.prototype.id,
  ): Promise<Empleado> {
    return this.loginRepository.empleado(id);
  }
}
