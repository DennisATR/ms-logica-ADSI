import {authenticate} from '@loopback/authentication';
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
import {Credenciales, Login, Usuario} from '../models';
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
  @authenticate({
    strategy: 'auth',
    options: ['usuario', 'guardar'],
  })
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
            exclude: ['id', 'FechaReg'],
          }),
        },
      },
    })
    usuario: Omit<Usuario, 'id'>,
  ): Promise<Usuario> {
    const fechaRegistro = new Date().toLocaleString('sv-SE', {timeZone: 'America/Bogota'});
    usuario.FechaReg = fechaRegistro;
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
  @authenticate({
    strategy: 'auth',
    options: ['usuario', 'listar'],
  })
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
  @authenticate({
    strategy: 'auth',
    options: ['usuario', 'listar'],
  })
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
  @authenticate({
    strategy: 'auth',
    options: ['usuario', 'editar'],
  })
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
  @authenticate({
    strategy: 'auth',
    options: ['usuario', 'listar'],
  })
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
  @authenticate({
    strategy: 'auth',
    options: ['usuario', 'editar'],
  })
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
  @authenticate({
    strategy: 'auth',
    options: ['usuario', 'editar'],
  })
  @response(204, {
    description: 'Usuario PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() usuario: Usuario,
  ): Promise<void> {
    usuario.FechaReg = new Date().toLocaleString('sv-SE', {timeZone: 'America/Bogota'});

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
  @authenticate({
    strategy: 'auth',
    options: ['usuario', 'eliminar'],
  })
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
    const user = await this.seguridadUsuarioService.identificarUsuario(credentials);
    const fechaRegistro = new Date().toLocaleString('sv-SE', {timeZone: 'America/Bogota'});
    console.log(fechaRegistro);
    if (user) {
      // Generar token y registrar el login con token
      const token = this.seguridadUsuarioService.crearToken(user);
      let login: Login = new Login();
      login.usuarioId = user.id!; // Este dato id si o si va a llegar
      login.Fecha = fechaRegistro;
      login.Token = token;
      await this.loginRepository.create(login);

      // Obtener permisos del usuario basados en su rol
      const menu = await this.seguridadUsuarioService.ConsultarPermisosDeMenuPorUsuario(user.rolId!);

      return {user, token, menu};
    }
    throw new HttpErrors.Unauthorized('Credenciales incorrectas.');
  }

}

