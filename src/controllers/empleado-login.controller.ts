import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  Empleado,
  Login,
} from '../models';
import {EmpleadoRepository} from '../repositories';

export class EmpleadoLoginController {
  constructor(
    @repository(EmpleadoRepository) protected empleadoRepository: EmpleadoRepository,
  ) { }

  @get('/empleados/{id}/logins', {
    responses: {
      '200': {
        description: 'Array of Empleado has many Login',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Login)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<Login>,
  ): Promise<Login[]> {
    return this.empleadoRepository.logins(id).find(filter);
  }

  @post('/empleados/{id}/logins', {
    responses: {
      '200': {
        description: 'Empleado model instance',
        content: {'application/json': {schema: getModelSchemaRef(Login)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Empleado.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Login, {
            title: 'NewLoginInEmpleado',
            exclude: ['id'],
            optional: ['empleadoId']
          }),
        },
      },
    }) login: Omit<Login, 'id'>,
  ): Promise<Login> {
    return this.empleadoRepository.logins(id).create(login);
  }

  @patch('/empleados/{id}/logins', {
    responses: {
      '200': {
        description: 'Empleado.Login PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Login, {partial: true}),
        },
      },
    })
    login: Partial<Login>,
    @param.query.object('where', getWhereSchemaFor(Login)) where?: Where<Login>,
  ): Promise<Count> {
    return this.empleadoRepository.logins(id).patch(login, where);
  }

  @del('/empleados/{id}/logins', {
    responses: {
      '200': {
        description: 'Empleado.Login DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(Login)) where?: Where<Login>,
  ): Promise<Count> {
    return this.empleadoRepository.logins(id).delete(where);
  }
}
