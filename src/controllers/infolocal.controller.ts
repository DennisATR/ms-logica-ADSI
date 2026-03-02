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
import {Infolocal} from '../models';
import {Informacion} from '../models/informacion.model';
import {AlmacenRepository, InfolocalRepository} from '../repositories';

export class InfolocalController {
  constructor(
    @repository(AlmacenRepository)
    public almacenRepository: AlmacenRepository,
    @repository(InfolocalRepository)
    public infolocalRepository: InfolocalRepository,
  ) { }

  @post('/infolocal')
  @response(200, {
    description: 'Infolocal + Almacen creados',
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Informacion, {
            title: 'InformacionInput',
            exclude: ['id'],
          }),
        },
      },
    })
    info: Omit<Informacion, 'id'>,
  ): Promise<Infolocal> {
    const almacen = await this.almacenRepository.create({
      Nombre: info.Nombre,
      Prefijo: info.Prefijo,
    });
    const infolocal = await this.infolocalRepository.create({
      Nombre: info.Nombre,
      Direccion: info.Direccion,
      NIT: info.NIT,
      Iva: info.Iva,
      Mensaje: info.Mensaje,
      Telefono: info.Telefono,
      almacenId: almacen.id,
    });
    return infolocal;
  }

  @get('/infolocal/count')
  @response(200, {
    description: 'Infolocal model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Infolocal) where?: Where<Infolocal>,
  ): Promise<Count> {
    return this.infolocalRepository.count(where);
  }

  @get('/infolocal')
  @response(200, {
    description: 'Array of Infolocal model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Infolocal, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Infolocal) filter?: Filter<Infolocal>,
  ): Promise<Infolocal[]> {
    return this.infolocalRepository.find(filter);
  }

  @patch('/infolocal')
  @response(200, {
    description: 'Infolocal PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Infolocal, {partial: true}),
        },
      },
    })
    infolocal: Infolocal,
    @param.where(Infolocal) where?: Where<Infolocal>,
  ): Promise<Count> {
    return this.infolocalRepository.updateAll(infolocal, where);
  }

  @get('/infolocal/{id}')
  @response(200, {
    description: 'Infolocal model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Infolocal, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Infolocal, {exclude: 'where'}) filter?: FilterExcludingWhere<Infolocal>
  ): Promise<Infolocal> {
    return this.infolocalRepository.findById(id, filter);
  }

  @patch('/infolocal/{id}')
  @response(204, {
    description: 'Infolocal PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Infolocal, {partial: true}),
        },
      },
    })
    infolocal: Infolocal,
  ): Promise<void> {
    await this.infolocalRepository.updateById(id, infolocal);
  }

  @put('/infolocal/{id}')
  @response(204, {
    description: 'Infolocal + Almacen updated successfully',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Informacion, {
            title: 'UpdateInformacion',
            exclude: ['id'],
          }),
        },
      },
    })
    info: Omit<Informacion, 'id'>,
  ): Promise<void> {
    const infolocalActual = await this.infolocalRepository.findById(id);
    await this.almacenRepository.updateById(infolocalActual.almacenId, {
      Nombre: info.Nombre,
      Prefijo: info.Prefijo,
    });
    await this.infolocalRepository.updateById(id, {
      Nombre: info.Nombre,
      Direccion: info.Direccion,
      NIT: info.NIT,
      Iva: info.Iva,
      Mensaje: info.Mensaje,
      Telefono: info.Telefono,
    });
  }

  @del('/infolocal/{id}')
  @response(204, {
    description: 'Infolocal DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.infolocalRepository.deleteById(id);
  }
}
