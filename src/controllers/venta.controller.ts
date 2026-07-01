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
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {Devolucion, ResumenDelDiaVentas, Venta} from '../models';
import {FacturaRepository, InfolocalRepository, VentaRepository, ZapatoRepository} from '../repositories';
import {ImpresoraService} from '../services';

export class VentaController {
  constructor(
    @repository(VentaRepository)
    public ventaRepository: VentaRepository,
    @repository(ZapatoRepository)
    public zapatoRepository: ZapatoRepository,
    @repository(InfolocalRepository)
    public infolocalRepository: InfolocalRepository,
    @repository(FacturaRepository)
    public facturaRepository: FacturaRepository,
    @service(ImpresoraService)
    public impresoraService: ImpresoraService,
  ) { }

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
    @param.query.string('lugarImpresion') lugarImpresion?: string,
  ): Promise<Venta> {
    // Obtener el zapato correspondiente
    const zapato = await this.zapatoRepository.findById(venta.zapatoId);

    // Restar la cantidad vendida del stock del zapato
    const nuevaCantidad = zapato.Cantidad - venta.Cantidad;
    await this.zapatoRepository.updateById(zapato.id, {Cantidad: nuevaCantidad});

    // Obtener el último registro de Infolocal
    const [latestInfolocal] = await this.infolocalRepository.find({
      order: ['id DESC'],
      limit: 1,
    });

    if (!latestInfolocal) {
      throw new Error('No se encontró un registro válido en Infolocal');
    }

    // Crear la venta
    const nuevaVenta = await this.ventaRepository.create(venta);

    // Recalcular el total real de la factura basado en sus ventas.
    const ventasFactura = await this.ventaRepository.find({
      where: {facturaId: venta.facturaId},
      fields: {Cantidad: true, Precio: true},
    });

    const nuevoTotal = ventasFactura.reduce(
      (acumulado, ventaFactura) => acumulado + (ventaFactura.Cantidad * ventaFactura.Precio),
      0,
    );

    await this.facturaRepository.updateById(venta.facturaId, {Total: nuevoTotal});

    return nuevaVenta;
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

  @get('/venta/cantidad-zapatos-vendidos/fecha/{fecha}')
  @response(200, {
    description: 'Cantidad de zapatos vendidos por fecha',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['fecha', 'cantidad'],
          properties: {
            fecha: {type: 'string'},
            cantidad: {type: 'number'},
          },
        },
      },
    },
  })
  async cantidadVendidaPorFecha(
    @param.path.string('fecha') fecha: string,
  ): Promise<{fecha: string; cantidad: number}> {
    const soloFecha = fecha.slice(0, 10);

    const facturasDelDia = await this.facturaRepository.find({
      where: {
        Fecha: {
          like: `${soloFecha}%`,
        },
      },
      fields: {
        id: true,
      },
    });

    const facturaIds = facturasDelDia
      .map(factura => factura.id)
      .filter((id): id is number => typeof id === 'number');

    if (facturaIds.length === 0) {
      return {fecha: soloFecha, cantidad: 0};
    }

    const ventasDelDia = await this.ventaRepository.find({
      where: {
        facturaId: {
          inq: facturaIds,
        },
      },
      fields: {
        Cantidad: true,
      },
    });

    const cantidad = ventasDelDia.reduce((acumulado, venta) => {
      return acumulado + venta.Cantidad;
    }, 0);

    return {fecha: soloFecha, cantidad};
  }

  @get('/venta/resumen-dia/fecha/{fecha}')
  @response(200, {
    description: 'Resumen de ventas por fecha y por zapato',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(ResumenDelDiaVentas),
        },
      },
    },
  })
  async resumenVentasDelDia(
    @param.path.string('fecha') fecha: string,
  ): Promise<ResumenDelDiaVentas[]> {
    const soloFecha = fecha.slice(0, 10);

    const facturasDelDia = await this.facturaRepository.find({
      where: {
        Fecha: {
          like: `${soloFecha}%`,
        },
      },
      fields: {
        id: true,
      },
    });

    const facturaIds = facturasDelDia
      .map(factura => factura.id)
      .filter((id): id is number => typeof id === 'number');

    if (facturaIds.length === 0) {
      return [];
    }

    const ventasDelDia = await this.ventaRepository.find({
      where: {
        facturaId: {
          inq: facturaIds,
        },
      },
      include: [{relation: 'zapato'}],
    }) as Array<Venta & {zapato?: {Descripcion?: string}}>;

    const resumenPorZapato = new Map<string, {
      descripcion: string;
      cantidad: number;
      valor: number;
    }>();

    for (const venta of ventasDelDia) {
      const descripcion = venta.zapato?.Descripcion ?? 'Sin descripcion';
      const clave = venta.zapatoId;

      const acumulado = resumenPorZapato.get(clave) ?? {
        descripcion,
        cantidad: 0,
        valor: 0,
      };

      acumulado.cantidad += venta.Cantidad;
      acumulado.valor += venta.Cantidad * venta.Precio;

      resumenPorZapato.set(clave, acumulado);
    }

    return Array.from(resumenPorZapato.values()).map(item => new ResumenDelDiaVentas(item));
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

  @get('/venta/factura/{facturaId}')
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
  async findVendasByFacturaId(
    @param.path.number('facturaId') facturaId: number,
  ): Promise<Venta[]> {
    return this.ventaRepository.find({
      where: {
        facturaId,
      },
      include: [{relation: 'zapato'}],
    });
  }

  @get('/venta/factura/{facturaId}/devoluciones-elegibles')
  @response(200, {
    description: 'Ventas elegibles para devolución por factura',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Venta, {includeRelations: true}),
        },
      },
    },
  })
  async findVendasEligibleForDevolucionByFacturaId(
    @param.path.number('facturaId') facturaId: number,
  ): Promise<Venta[]> {
    const ventas = await this.ventaRepository.find({
      where: {facturaId},
      include: [
        {relation: 'devolucions'},
        {relation: 'zapato'},
      ],
    }) as Array<Venta & {devolucions?: Array<Partial<Devolucion>>}>;

    const elegibles = ventas
      .filter(venta => {
        const totalDevolucion = (venta.devolucions ?? []).reduce((acum, d) => acum + (d.Cantidad ?? 0), 0);
        return (venta.Cantidad - totalDevolucion) > 0;
      })
      .map(venta => {
        const totalDevolucion = (venta.devolucions ?? []).reduce((acum, d) => acum + (d.Cantidad ?? 0), 0);
        const cantidadDisponible = venta.Cantidad - totalDevolucion;
        venta.Cantidad = cantidadDisponible;
        return venta;
      });

    return elegibles;
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
