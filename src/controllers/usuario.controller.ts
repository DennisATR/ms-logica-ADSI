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
import {LoginRepository, UsuarioRepository, VendedorRepository} from '../repositories';
import {SeguridadUsuarioService} from '../services';

export class UsuarioController {
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository,
    @service(SeguridadUsuarioService)
    public seguridadUsuarioService: SeguridadUsuarioService,
    @repository(LoginRepository)
    public loginRepository: LoginRepository,
    @repository(VendedorRepository)
    public vendedorRepository: VendedorRepository,
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

    const creado = await this.usuarioRepository.create(usuario);

    // Crear Vendedor automáticamente si el rol es Asesor (rolId 2)
    if (usuario.rolId === 2) {
      try {
        const idVendedor = await this.vendedorRepository.generarIdVendedor(fechaRegistro);
        await this.vendedorRepository.create({
          id: idVendedor,
          Nombre: usuario.Nombre,
          Apellido: usuario.Apellido,
          Telefono: usuario.Telefono,
          Correo: usuario.Correo,
          Clave: usuario.Clave,
          usuarioId: creado.id,
          FechaReg: fechaRegistro
        });
      } catch (e) {
        console.error("Error al crear vendedor asociado al usuario:", e);
      }
    }

    return creado;
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
    const usuarioActualizado = await this.usuarioRepository.findById(id);

    if (usuarioActualizado.rolId === 2) {
      try {
        const vendedor = await this.vendedorRepository.findOne({where: {usuarioId: id}});
        if (vendedor) {
          const updateData: any = {};
          if (usuario.Nombre) updateData.Nombre = usuario.Nombre;
          if (usuario.Apellido) updateData.Apellido = usuario.Apellido;
          if (usuario.Telefono) updateData.Telefono = usuario.Telefono;
          if (usuario.Correo) updateData.Correo = usuario.Correo;
          if (usuario.Clave) updateData.Clave = usuario.Clave; // Ya cifrada o por cifrar? En patch usualmente ya se maneja en el frontend o aqui no lo ciframos, pero lo ideal es usar replaceById. Wait, replaceById is what is mostly used. 
          await this.vendedorRepository.updateById(vendedor.id, updateData);
        }
      } catch (e) {
        console.error("Error al actualizar vendedor asociado:", e);
      }
    }
  }

  private formatFechaMySQL(val: any): string {
    if (!val) {
      return new Date().toLocaleString('sv-SE', {timeZone: 'America/Bogota'}).replace('T', ' ').substring(0, 19);
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      return new Date().toLocaleString('sv-SE', {timeZone: 'America/Bogota'}).replace('T', ' ').substring(0, 19);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
    const usuarioAnterior = await this.usuarioRepository.findById(id);
    usuario.FechaReg = this.formatFechaMySQL(usuarioAnterior.FechaReg || usuario.FechaReg);

    if (usuario.Clave && usuario.Clave !== usuarioAnterior.Clave) {
      usuario.Clave = this.seguridadUsuarioService.cifrarTexto(usuario.Clave);
    } else {
      usuario.Clave = usuarioAnterior.Clave;
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

    if (usuario.rolId === 2) {
      try {
        const vendedor = await this.vendedorRepository.findOne({where: {usuarioId: id}});
        if (vendedor) {
          const updateData: any = {
            Nombre: usuario.Nombre,
            Apellido: usuario.Apellido,
            Telefono: usuario.Telefono,
            Correo: usuario.Correo,
          };
          if (usuario.Clave) {
             updateData.Clave = usuario.Clave; // Ya cifrada en las líneas anteriores
          }
          await this.vendedorRepository.updateById(vendedor.id, updateData);
        }
      } catch (e) {
        console.error("Error al actualizar vendedor asociado:", e);
      }
    }
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
    const usuario = await this.usuarioRepository.findById(id);
    if (usuario.rolId === 2) {
       try {
         const vendedor = await this.vendedorRepository.findOne({where: {usuarioId: id}});
         if (vendedor) {
           await this.vendedorRepository.deleteById(vendedor.id);
         }
       } catch (e) {
         console.error("Error al eliminar vendedor asociado:", e);
       }
    }
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

