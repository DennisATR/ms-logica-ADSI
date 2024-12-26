import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {Credenciales, Empleado, Login} from '../models';
import {EmpleadoRepository, LoginRepository} from '../repositories';
import {SeguridadUsuarioService} from '../services';

export class EmpleadoController {
  constructor(
    @repository(EmpleadoRepository)
    public empleadoRepository : EmpleadoRepository,
    @service(SeguridadUsuarioService)
    public seguridadUsuarioService: SeguridadUsuarioService,
    @repository(LoginRepository)
    public loginRepository: LoginRepository,
  ) {}

  @post('/empleado')
  @response(200, {
    description: 'Empleado model instance',
    content: {'application/json': {schema: getModelSchemaRef(Empleado)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Empleado, {
            title: 'NewEmpleado',
            exclude: ['id'],
          }),
        },
      },
    })
    empleado: Omit<Empleado, 'id'>,
  ): Promise<Empleado> {
     // Verificar si el usuario ya existe
     let usuarioExistente = await this.empleadoRepository.findOne({
      where: {Correo: empleado.Correo},
    });

    if (usuarioExistente) {
      throw new HttpErrors[400]('El usuario ya existe.');
    }

    // Verifica si el correo es unico o ya no hay un usuario con ese correo
    let usuarioExistenteCorreo = await this.empleadoRepository.findOne({
      where: {Correo: empleado.Correo},
    });
    if (usuarioExistenteCorreo) {
      throw new HttpErrors[400]('El correo ya esta en uso.');
    }
    // Cifrar la clave
    let claveCifrada;
    if (empleado.Clave) {
      claveCifrada = this.seguridadUsuarioService.cifrarTexto(empleado.Clave);
    }
    // Asignar la clave al usuario
    empleado.Clave = claveCifrada || '';
    return this.empleadoRepository.create(empleado);
  }

  @get('/empleado/count')
  @response(200, {
    description: 'Empleado model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Empleado) where?: Where<Empleado>,
  ): Promise<Count> {
    return this.empleadoRepository.count(where);
  }

  @get('/empleado')
  @response(200, {
    description: 'Array of Empleado model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Empleado, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Empleado) filter?: Filter<Empleado>,
  ): Promise<Empleado[]> {
    return this.empleadoRepository.find(filter);
  }

  @patch('/empleado')
  @response(200, {
    description: 'Empleado PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Empleado, {partial: true}),
        },
      },
    })
    empleado: Empleado,
    @param.where(Empleado) where?: Where<Empleado>,
  ): Promise<Count> {
    return this.empleadoRepository.updateAll(empleado, where);
  }

  @get('/empleado/{id}')
  @response(200, {
    description: 'Empleado model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Empleado, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Empleado, {exclude: 'where'}) filter?: FilterExcludingWhere<Empleado>
  ): Promise<Empleado> {
    return this.empleadoRepository.findById(id, filter);
  }

  @patch('/empleado/{id}')
  @response(204, {
    description: 'Empleado PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Empleado, {partial: true}),
        },
      },
    })
    empleado: Empleado,
  ): Promise<void> {
    await this.empleadoRepository.updateById(id, empleado);
  }

  @put('/empleado/{id}')
  @response(204, {
    description: 'Empleado PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() empleado: Empleado,
  ): Promise<void> {
    await this.empleadoRepository.replaceById(id, empleado);
  }

  @del('/empleado/{id}')
  @response(204, {
    description: 'Empleado DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.empleadoRepository.deleteById(id);
  }

  @post('/identificar-usuario')
  @response(200, {
    description: 'Identificar un usuario por correo y clave',
    content: {'application/json': {schema: getModelSchemaRef(Empleado)}},
  })
  async identificarUsuario(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Credenciales),
        },
      },
    })
    credentials: Credenciales,
  ): Promise<object> {
    let user = await this.seguridadUsuarioService.identificarUsuario(credentials);
    if (user) {
      let login: Login = new Login();
      login.empleadoId = user.id!; // Este dato _id si o si va a llegar
      login.Fecha = new Date().toString();
      this.loginRepository.create(login);
      return user;
    }
    return new HttpErrors[401]('Credenciales incorrectas. ');
  }
}
