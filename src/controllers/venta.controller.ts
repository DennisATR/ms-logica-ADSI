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
import {Venta} from '../models';
import {FacturaRepository, InfolocalRepository, VentaRepository, ZapatoRepository} from '../repositories';

export class VentaController {
  constructor(
    @repository(VentaRepository)
    public ventaRepository : VentaRepository,
    @repository(ZapatoRepository)
    public zapatoRepository : ZapatoRepository,
    @repository(InfolocalRepository)
    public infolocalRepository : InfolocalRepository,
    @repository(FacturaRepository)
    public facturaRepository : FacturaRepository,
  ) {}

  @post('/venta')
@response(200, {
  description: 'Venta model instance',
  content: {'application/json': {schema: getModelSchemaRef(Venta)}},
})
async create(
  @requestBody({
    content: {
      'application/json': {
        schema: getModelSchemaRef(Venta, {
          title: 'NewVenta',
          exclude: ['id'],
        }),
      },
    },
  })
  venta: Omit<Venta, 'id'>,
): Promise<Venta> {
  // Obtener el zapato correspondiente
  const zapato = await this.zapatoRepository.findById(venta.zapatoId);

  // Obtener el último registro de Infolocal
  const [latestInfolocal] = await this.infolocalRepository.find({
    order: ['id DESC'],
    limit: 1,
  });

  if (!latestInfolocal) {
    throw new Error('No se encontró un registro válido en Infolocal');
  }

  // Verificar si el almacén del zapato coincide con el último registro de Infolocal
  if (venta.Almacen === latestInfolocal.Nombre) {
    // Si el zapato pertenece al almacén, verificar stock y reducirlo
    if (zapato.Cantidad < venta.Cantidad) {
      throw new Error('No hay suficiente stock para completar la venta');
    }

    zapato.Cantidad -= venta.Cantidad;
    await this.zapatoRepository.updateById(zapato.id, zapato);
  } else {
    // Si el zapato no pertenece al almacén, permitir la venta pero no modificar el stock
    console.warn(
      `La venta fue realizada, pero el zapato no pertenece al almacén: ${latestInfolocal.Nombre}. El stock no será reducido.`
    );
  }

  // Actualizar el total de la factura
  const factura = await this.facturaRepository.findById(venta.facturaId);
  factura.Total += venta.Cantidad * venta.Precio;
  // Crear la venta
  return this.ventaRepository.create(venta);
}

  @get('/venta/count')
  @response(200, {
    description: 'Venta model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Venta) where?: Where<Venta>,
  ): Promise<Count> {
    return this.ventaRepository.count(where);
  }

  @get('/venta')
  @response(200, {
    description: 'Array of Venta model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Venta, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Venta) filter?: Filter<Venta>,
  ): Promise<Venta[]> {
    return this.ventaRepository.find(filter);
  }

  @patch('/venta')
  @response(200, {
    description: 'Venta PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Venta, {partial: true}),
        },
      },
    })
    venta: Venta,
    @param.where(Venta) where?: Where<Venta>,
  ): Promise<Count> {
    return this.ventaRepository.updateAll(venta, where);
  }

  @get('/venta/{id}')
  @response(200, {
    description: 'Venta model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Venta, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Venta, {exclude: 'where'}) filter?: FilterExcludingWhere<Venta>
  ): Promise<Venta> {
    return this.ventaRepository.findById(id, filter);
  }

  @patch('/venta/{id}')
  @response(204, {
    description: 'Venta PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Venta, {partial: true}),
        },
      },
    })
    venta: Venta,
  ): Promise<void> {
    await this.ventaRepository.updateById(id, venta);
  }

  @put('/venta/{id}')
  @response(204, {
    description: 'Venta PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() venta: Venta,
  ): Promise<void> {
    await this.ventaRepository.replaceById(id, venta);
  }

  @del('/venta/{id}')
  @response(204, {
    description: 'Venta DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.ventaRepository.deleteById(id);
  }
}
