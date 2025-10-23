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
import {CambioClave, Credenciales, Empleado, Login} from '../models';
import {EmpleadoRepository, LoginRepository} from '../repositories';
import {SeguridadUsuarioService} from '../services';

export class EmpleadoController {
  constructor(
    @repository(EmpleadoRepository)
    public empleadoRepository: EmpleadoRepository,
    @service(SeguridadUsuarioService)
    public seguridadUsuarioService: SeguridadUsuarioService,
    @repository(LoginRepository)
    public loginRepository: LoginRepository,
  ) { }

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
    empleado.FechaReg = new Date().toISOString();
    // Verificar si ya existe un empleado con el mismo correo
    const existente = await this.empleadoRepository.findOne({
      where: {Correo: empleado.Correo},
    });

    if (existente) {
      throw new HttpErrors.UnprocessableEntity(`El correo '${empleado.Correo}' ya está en uso.`);
    }

    // Cifrar la clave
    try {
      empleado.Clave = this.seguridadUsuarioService.cifrarTexto(empleado.Clave);
    } catch (error) {
      throw new HttpErrors.InternalServerError('Error al cifrar la clave del usuario.');
    }

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
    empleado.FechaReg = new Date().toISOString();

    if (empleado.Clave) {
      empleado.Clave = this.seguridadUsuarioService.cifrarTexto(empleado.Clave);
    }

    if (empleado.Correo) {
      let usuarioExistenteCorreo = await this.empleadoRepository.findOne({
        where: {Correo: empleado.Correo, id: {neq: id}},
      });
      if (usuarioExistenteCorreo) {
        throw new HttpErrors.BadRequest(`El correo '${empleado.Correo}' ya se encuentra en uso por otro usuario.`);
      }
    }
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

  /* El método `cambiarClave` es un endpoint POST que permite al usuario
cambiar su contraseña. Se necesita un cuerpo de solicitud que contiene el
modelo `CambioClave`, que representa la dirección de correo electrónico del
usuario, su contraseña actual y la contraseña nueva. */
  @patch('/cambiar-clave')
  @response(200, {
    description: 'Usuario model instance',
    content: {'application/json': {schema: getModelSchemaRef(Empleado)}},
  })
  async cambiarClave(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CambioClave, {partial: true}),
        },
      },
    })
    cambioClave: CambioClave,
  ): Promise<object> {
    const credenciales = {
      correo: cambioClave.correo,
      clave: cambioClave.claveActual,
    };

    //Cifrar la clave ingresada por el usuario.
    credenciales.clave = this.seguridadUsuarioService.cifrarTexto(credenciales.clave);

    // Buscar al usuario que corresponda con las credenciales ingresadas.
    const empleado = await this.empleadoRepository.findOne({
      where: {
        Correo: credenciales.correo,
        Clave: credenciales.clave,
      },
    });

    // Verificar si el usuario existe.
    if (!empleado) {
      throw new HttpErrors.NotFound('Usuario no encontrado');
    }

    // Verificar si la contraseña actual es correcta utilizando la función identificarUsuario
    const credenciales2: Credenciales = credenciales as unknown as Credenciales;
    let usuarioAutenticado =
      await this.seguridadUsuarioService.identificarUsuario(credenciales2);

    if (!usuarioAutenticado) {
      throw new HttpErrors[401]('Contraseña actual incorrecta');
    }

    // Asignar la contraseña nueva y actualizar el usuario.
    let nuevaClave = cambioClave.claveNueva;
    let nuevaClaveCifrada = this.seguridadUsuarioService.cifrarTexto(nuevaClave);
    empleado.Clave = nuevaClaveCifrada;
    await this.empleadoRepository.updateById(empleado.getId(), empleado);
    return empleado;
  }
}
