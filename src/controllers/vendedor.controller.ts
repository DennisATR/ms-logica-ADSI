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
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {Vendedor} from '../models';
import {VendedorRepository} from '../repositories';

import {UsuarioRepository} from '../repositories';
import {SeguridadUsuarioService} from '../services';
import {service} from '@loopback/core';

export class VendedorController {
  constructor(
    @repository(VendedorRepository)
    public vendedorRepository: VendedorRepository,
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository,
    @service(SeguridadUsuarioService)
    public seguridadUsuarioService: SeguridadUsuarioService,
  ) { }

  @post('/vendedor')
  @response(200, {
    description: 'Vendedor model instance',
    content: {'application/json': {schema: getModelSchemaRef(Vendedor)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Vendedor, {
            title: 'NewVendedor',
            exclude: ['id', 'FechaReg'],
          }),
        },
      },
    })
    vendedor: Omit<Vendedor, 'id'>,
  ): Promise<Vendedor> {
    const fechaRegistro = new Date().toLocaleString('sv-SE', {timeZone: 'America/Bogota'});

    // 1. Crear Usuario primero para obtener su ID auto-incremental
    let usuarioCreado;
    try {
      const claveCifrada = this.seguridadUsuarioService.cifrarTexto(vendedor.Clave);
      usuarioCreado = await this.usuarioRepository.create({
        Nombre: vendedor.Nombre,
        Apellido: vendedor.Apellido,
        Telefono: vendedor.Telefono,
        Correo: vendedor.Correo!,
        Clave: claveCifrada,
        rolId: 2, // Rol Asesor
        FechaReg: fechaRegistro
      });
    } catch (e) {
      console.error("Error al crear usuario asociado al vendedor:", e);
      throw e;
    }

    // 2. Crear Vendedor usando el id del Usuario
    const nuevoVendedor = {
      ...vendedor,
      id: await this.vendedorRepository.generarIdVendedor(fechaRegistro),
      usuarioId: usuarioCreado.id,
      FechaReg: fechaRegistro
    };

    return this.vendedorRepository.create(nuevoVendedor);
  }

  @get('/vendedor/count')
  @response(200, {
    description: 'Vendedor model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Vendedor) where?: Where<Vendedor>,
  ): Promise<Count> {
    return this.vendedorRepository.count(where);
  }

  @get('/vendedor')
  @response(200, {
    description: 'Array of Vendedor model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Vendedor, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Vendedor) filter?: Filter<Vendedor>,
  ): Promise<Vendedor[]> {
    return this.vendedorRepository.find(filter);
  }

  @patch('/vendedor')
  @response(200, {
    description: 'Vendedor PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Vendedor, {partial: true}),
        },
      },
    })
    vendedor: Vendedor,
    @param.where(Vendedor) where?: Where<Vendedor>,
  ): Promise<Count> {
    return this.vendedorRepository.updateAll(vendedor, where);
  }

  @get('/vendedor/{id}')
  @response(200, {
    description: 'Vendedor model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Vendedor, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Vendedor, {exclude: 'where'}) filter?: FilterExcludingWhere<Vendedor>
  ): Promise<Vendedor> {
    const vendedor = await this.vendedorRepository.findById(id, filter);
    if (!vendedor.Clave || vendedor.Clave === '') {
      try {
        let u = null;
        if (vendedor.usuarioId) {
          u = await this.usuarioRepository.findById(vendedor.usuarioId);
        } else if (vendedor.Correo) {
          u = await this.usuarioRepository.findOne({where: {Correo: vendedor.Correo}});
        }
        if (u) {
          if (!vendedor.usuarioId) vendedor.usuarioId = u.id;
          if (u.Clave) vendedor.Clave = u.Clave;
        }
      } catch (e) {
        console.error("Error al obtener clave del usuario para vendedor:", e);
      }
    }
    return vendedor;
  }

  @patch('/vendedor/{id}')
  @response(204, {
    description: 'Vendedor PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Vendedor, {partial: true}),
        },
      },
    })
    vendedor: Vendedor,
  ): Promise<void> {
    await this.vendedorRepository.updateById(id, vendedor);
    const vendedorActualizado = await this.vendedorRepository.findById(id);
    if (vendedorActualizado.usuarioId) {
      try {
        const updateData: any = {};
        if (vendedor.Nombre) updateData.Nombre = vendedor.Nombre;
        if (vendedor.Apellido) updateData.Apellido = vendedor.Apellido;
        if (vendedor.Telefono) updateData.Telefono = vendedor.Telefono;
        if (vendedor.Correo) updateData.Correo = vendedor.Correo;
        if (vendedor.Clave) updateData.Clave = this.seguridadUsuarioService.cifrarTexto(vendedor.Clave);
        
        await this.usuarioRepository.updateById(vendedorActualizado.usuarioId, updateData);
      } catch (e) {
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

  @put('/vendedor/{id}')
  @response(204, {
    description: 'Vendedor PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() vendedor: Vendedor,
  ): Promise<void> {
    const vendAnterior = await this.vendedorRepository.findById(id);

    if (!vendAnterior.usuarioId && vendAnterior.Correo) {
      try {
        const u = await this.usuarioRepository.findOne({where: {Correo: vendAnterior.Correo}});
        if (u) vendAnterior.usuarioId = u.id;
      } catch (e) {}
    }

    if (!vendedor.usuarioId && vendAnterior.usuarioId) {
      vendedor.usuarioId = vendAnterior.usuarioId;
    }

    let claveAnterior = vendAnterior.Clave;
    if ((!claveAnterior || claveAnterior === '') && vendAnterior.usuarioId) {
      try {
        const u = await this.usuarioRepository.findById(vendAnterior.usuarioId);
        if (u && u.Clave) claveAnterior = u.Clave;
      } catch (e) {}
    }

    if (vendedor.Clave && vendedor.Clave !== claveAnterior) {
      vendedor.Clave = this.seguridadUsuarioService.cifrarTexto(vendedor.Clave);
    } else {
      vendedor.Clave = claveAnterior || vendedor.Clave;
    }

    vendedor.FechaReg = this.formatFechaMySQL(vendAnterior.FechaReg || vendedor.FechaReg);

    await this.vendedorRepository.replaceById(id, vendedor);

    if (vendedor.usuarioId) {
      try {
         const updateData: any = {
           Nombre: vendedor.Nombre,
           Apellido: vendedor.Apellido,
           Telefono: vendedor.Telefono,
           Correo: vendedor.Correo,
           Clave: vendedor.Clave
         };
         await this.usuarioRepository.updateById(vendedor.usuarioId, updateData);
      } catch (e) {
         console.error("Error al actualizar usuario asociado:", e);
      }
    }
  }

  @del('/vendedor/{id}')
  @response(204, {
    description: 'Vendedor DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    const vendedor = await this.vendedorRepository.findById(id);
    if (vendedor.usuarioId) {
       try {
         await this.usuarioRepository.deleteById(vendedor.usuarioId);
       } catch (e) {
         console.error("Error al eliminar usuario asociado:", e);
       }
    }
    await this.vendedorRepository.deleteById(id);
  }
}
