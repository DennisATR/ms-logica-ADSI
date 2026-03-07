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
import {CambioClave, Credenciales, Login, Usuario} from '../models';
import {LoginRepository, UsuarioRepository} from '../repositories';
import {SeguridadUsuarioService} from '../services';

export class UsuarioController {
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository,
    @service(SeguridadUsuarioService)
    public seguridadUsuarioService: SeguridadUsuarioService,
    @repository(LoginRepository)
    public loginRepository: LoginRepository,
  ) { }

  @post('/usuario')
  @response(200, {
    description: 'Usuario model instance',
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {
            title: 'NewUsuario',
            exclude: ['id'],
          }),
        },
      },
    })
    usuario: Omit<Usuario, 'id'>,
  ): Promise<Usuario> {
    usuario.FechaReg = new Date().toISOString();
    // Verificar si ya existe un usuario con el mismo correo
    const existente = await this.usuarioRepository.findOne({
      where: {Correo: usuario.Correo},
    });

    if (existente) {
      throw new HttpErrors.UnprocessableEntity(`El correo '${usuario.Correo}' ya está en uso.`);
    }

    // Cifrar la clave
    try {
      usuario.Clave = this.seguridadUsuarioService.cifrarTexto(usuario.Clave);
    } catch (error) {
      throw new HttpErrors.InternalServerError('Error al cifrar la clave del usuario.');
    }

    return this.usuarioRepository.create(usuario);
  }

  @get('/usuario/count')
  @response(200, {
    description: 'Usuario model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.count(where);
  }

  @get('/usuario')
  @response(200, {
    description: 'Array of Usuario model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Usuario, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Usuario) filter?: Filter<Usuario>,
  ): Promise<Usuario[]> {
    return this.usuarioRepository.find(filter);
  }

  @patch('/usuario')
  @response(200, {
    description: 'Usuario PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.updateAll(usuario, where);
  }

  @get('/usuario/{id}')
  @response(200, {
    description: 'Usuario model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Usuario, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Usuario, {exclude: 'where'}) filter?: FilterExcludingWhere<Usuario>
  ): Promise<Usuario> {
    return this.usuarioRepository.findById(id, filter);
  }

  @patch('/usuario/{id}')
  @response(204, {
    description: 'Usuario PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.updateById(id, usuario);
  }

  @put('/usuario/{id}')
  @response(204, {
    description: 'Usuario PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() usuario: Usuario,
  ): Promise<void> {
    usuario.FechaReg = new Date().toISOString();

    if (usuario.Clave) {
      usuario.Clave = this.seguridadUsuarioService.cifrarTexto(usuario.Clave);
    }

    if (usuario.Correo) {
      let usuarioExistenteCorreo = await this.usuarioRepository.findOne({
        where: {Correo: usuario.Correo, id: {neq: id}},
      });
      if (usuarioExistenteCorreo) {
        throw new HttpErrors.BadRequest(`El correo '${usuario.Correo}' ya se encuentra en uso por otro usuario.`);
      }
    }
    await this.usuarioRepository.replaceById(id, usuario);
  }

  @del('/usuario/{id}')
  @response(204, {
    description: 'Usuario DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.usuarioRepository.deleteById(id);
  }

  @post('/identificar-usuario')
  @response(200, {
    description: 'Identificar un usuario por correo y clave',
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
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
    const fechaRegistro = new Date().toLocaleString('sv-SE', {timeZone: 'America/Bogota'});
    console.log(fechaRegistro);
    if (user) {
      let login: Login = new Login();
      login.usuarioId = user.id!; // Este dato _id si o si va a llegar
      login.Fecha = fechaRegistro;
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
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
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
    const usuario = await this.usuarioRepository.findOne({
      where: {
        Correo: credenciales.correo,
        Clave: credenciales.clave,
      },
    });

    // Verificar si el usuario existe.
    if (!usuario) {
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
    usuario.Clave = nuevaClaveCifrada;
    await this.usuarioRepository.updateById(usuario.getId(), usuario);
    return usuario;
  }
}

