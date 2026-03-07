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

export class VendedorController {
  constructor(
    @repository(VendedorRepository)
    public vendedorRepository: VendedorRepository,
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

    const nuevoVendedor = {
      ...vendedor,
      id: await this.generarIdVendedor(fechaRegistro),
      FechaReg: fechaRegistro
    };

    return this.vendedorRepository.create(nuevoVendedor);
  }

  private async generarIdVendedor(fecha: string): Promise<string> {
    const año = fecha.substring(0, 4);
    const dia = fecha.substring(8, 10);
    const mes = fecha.substring(5, 7);
    const prefijo = año + dia + mes;
    const ultimoVendedor = await this.vendedorRepository.findOne({
      where: {
        id: {like: `${prefijo}%`}
      },
      order: ['id DESC']
    });

    let secuencial = 1;
    if (ultimoVendedor && ultimoVendedor.id) {
      const ultimoSecuencial = parseInt(ultimoVendedor.id.slice(-2));
      secuencial = ultimoSecuencial + 1;
    }
    const secuencialStr = secuencial.toString().padStart(2, '0');
    return prefijo + secuencialStr;
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
    return this.vendedorRepository.findById(id, filter);
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
  }

  @put('/vendedor/{id}')
  @response(204, {
    description: 'Vendedor PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() vendedor: Vendedor,
  ): Promise<void> {
    vendedor.FechaReg = new Date().toISOString();
    await this.vendedorRepository.replaceById(id, vendedor);
  }

  @del('/vendedor/{id}')
  @response(204, {
    description: 'Vendedor DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.vendedorRepository.deleteById(id);
  }
}
