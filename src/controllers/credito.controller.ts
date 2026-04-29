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
import {Credito, CreditoDetalle} from '../models';
import {ClienteRepository, CreditoRepository, FacturaRepository} from '../repositories';

export class CreditoController {
  constructor(
    @repository(CreditoRepository)
    public creditoRepository: CreditoRepository,
    @repository(FacturaRepository)
    public facturaRepository: FacturaRepository,
    @repository(ClienteRepository)
    public clienteRepository: ClienteRepository,
  ) { }

  @post('/credito')
  @response(200, {
    description: 'Credito model instance',
    content: {'application/json': {schema: getModelSchemaRef(Credito)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Credito, {
            title: 'NewCredito',
            exclude: ['id', 'FechaLimitePago'],
          }),
        },
      },
    })
    credito: Omit<Credito, 'id'>,
  ): Promise<Credito> {
    credito.FechaLimitePago = new Date().toLocaleString('sv-SE', {timeZone: 'America/Bogota'});
    return this.creditoRepository.create(credito);
  }

  @get('/credito/count')
  @response(200, {
    description: 'Credito model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Credito) where?: Where<Credito>,
  ): Promise<Count> {
    return this.creditoRepository.count(where);
  }

  @get('/credito')
  @response(200, {
    description: 'Array of Credito model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Credito, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Credito) filter?: Filter<Credito>,
  ): Promise<Credito[]> {
    return this.creditoRepository.find(filter);
  }

  @patch('/credito')
  @response(200, {
    description: 'Credito PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Credito, {partial: true}),
        },
      },
    })
    credito: Credito,
    @param.where(Credito) where?: Where<Credito>,
  ): Promise<Count> {
    return this.creditoRepository.updateAll(credito, where);
  }

  @get('/credito/{id}')
  @response(200, {
    description: 'Credito model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Credito, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Credito, {exclude: 'where'}) filter?: FilterExcludingWhere<Credito>
  ): Promise<Credito> {
    return this.creditoRepository.findById(id, filter);
  }

  @get('/credito/detalle/{id}')
  @response(200, {
    description: 'CreditoDetalle model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(CreditoDetalle, {includeRelations: true}),
      },
    },
  })
  async findDetalleById(
    @param.path.number('id') id: number,
  ): Promise<CreditoDetalle> {
    const credito = await this.creditoRepository.findById(id);

    // Cargar la factura con sus relaciones
    const factura = await this.facturaRepository.findById(credito.facturaId, {
      include: [
        {relation: 'cliente'},
        {relation: 'zapatos'},
        {relation: 'pagoFacturas'},
      ]
    });

    const cliente = (factura as any).cliente;
    const zapatos = (factura as any).zapatos || [];
    const pagos = (factura as any).pagoFacturas || [];

    // Calcular valores
    const valorTotal = factura.Total || 0;
    const valorAbonado = pagos.reduce((sum: number, pago: any) => sum + pago.Monto, 0);
    const saldo = valorTotal - valorAbonado;

    const detalle = new CreditoDetalle();
    detalle.id = credito.id;
    detalle.FechaLimitePago = credito.FechaLimitePago;
    detalle.Estado = credito.Estado;
    detalle.ClienteNombre = cliente?.Nombre || '';
    detalle.ClienteApellido = cliente?.Apellido || '';
    detalle.ValorTotal = valorTotal;
    detalle.ValorAbonado = valorAbonado;
    detalle.Saldo = saldo;
    detalle.FacturaId = factura.id || 0;

    if (zapatos.length > 0) {
      const zapato = zapatos[0];
      detalle.ZapatoDescripcion = zapato.Descripcion;
      detalle.ZapatoTalla = zapato.Talla;
      detalle.ZapatoColor = zapato.Color || '';
    }

    return detalle;
  }

  @get('/credito/cliente/{nombre}')
  @response(200, {
    description: 'Array of Credito model instances for a given client',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Credito, {includeRelations: true}),
        },
      },
    },
  })
  async findByClientName(
    @param.path.string('nombre') nombre: string,
  ): Promise<Credito[]> {
    // Buscar clientes por nombre o apellido
    const clientes = await this.clienteRepository.find({
      where: {
        or: [
          {Nombre: {like: `%${nombre}%`}},
          {Apellido: {like: `%${nombre}%`}},
        ]
      }
    });

    if (clientes.length === 0) {
      return [];
    }

    // Obtener IDs de los clientes encontrados
    const clienteIds = clientes.map(c => c.id).filter((id): id is number => id !== undefined);

    if (clienteIds.length === 0) {
      return [];
    }

    // Buscar facturas de esos clientes
    const facturas = await this.facturaRepository.find({
      where: {
        clienteId: {inq: clienteIds}
      }
    });

    if (facturas.length === 0) {
      return [];
    }

    // Obtener IDs de las facturas
    const facturaIds = facturas.map(f => f.id).filter((id): id is number => id !== undefined);

    if (facturaIds.length === 0) {
      return [];
    }

    // Buscar créditos de esas facturas
    return this.creditoRepository.find({
      where: {
        facturaId: {inq: facturaIds}
      },
      include: [{relation: 'factura'}]
    });
  }

  @get('/credito/factura/{facturaId}')
  @response(200, {
    description: 'Array of Credito model instances for a given invoice',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Credito, {includeRelations: true}),
        },
      },
    },
  })
  async findByFacturaId(
    @param.path.number('facturaId') facturaId: number,
  ): Promise<Credito[]> {
    return this.creditoRepository.find({
      where: {
        facturaId: facturaId
      },
      include: [{relation: 'factura'}]
    });
  }

  @patch('/credito/{id}')
  @response(204, {
    description: 'Credito PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Credito, {partial: true}),
        },
      },
    })
    credito: Credito,
  ): Promise<void> {
    await this.creditoRepository.updateById(id, credito);
  }

  @put('/credito/{id}')
  @response(204, {
    description: 'Credito PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() credito: Credito,
  ): Promise<void> {
    await this.creditoRepository.replaceById(id, credito);
  }

  @del('/credito/{id}')
  @response(204, {
    description: 'Credito DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.creditoRepository.deleteById(id);
  }
}
