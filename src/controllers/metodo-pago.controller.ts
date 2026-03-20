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
import {MetodoPago, ResumenDelDiaMetodoPago} from '../models';
import {FacturaRepository, MetodoPagoRepository} from '../repositories';

export class MetodoPagoController {
  constructor(
    @repository(MetodoPagoRepository)
    public metodoPagoRepository: MetodoPagoRepository,
    @repository(FacturaRepository)
    public facturaRepository: FacturaRepository,
  ) { }

  @post('/metodo-pago')
  @response(200, {
    description: 'MetodoPago model instance',
    content: {'application/json': {schema: getModelSchemaRef(MetodoPago)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MetodoPago, {
            title: 'NewMetodoPago',
            exclude: ['id'],
          }),
        },
      },
    })
    metodoPago: Omit<MetodoPago, 'id'>,
  ): Promise<MetodoPago> {
    return this.metodoPagoRepository.create(metodoPago);
  }

  @get('/metodo-pago/count')
  @response(200, {
    description: 'MetodoPago model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(MetodoPago) where?: Where<MetodoPago>,
  ): Promise<Count> {
    return this.metodoPagoRepository.count(where);
  }

  @get('/metodo-pago/resumen-dia/fecha/{fecha}')
  @response(200, {
    description: 'Resumen de ventas por fecha y por metodo de pago',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(ResumenDelDiaMetodoPago),
        },
      },
    },
  })
  async resumenMetodoPagoPorDia(
    @param.path.string('fecha') fecha: string,
  ): Promise<ResumenDelDiaMetodoPago[]> {
    const soloFecha = fecha.slice(0, 10);

    const facturasDelDia = await this.facturaRepository.find({
      where: {
        Fecha: {
          like: `${soloFecha}%`,
        },
      },
      include: [{relation: 'metodoPago'}],
    }) as Array<any>;

    if (facturasDelDia.length === 0) {
      return [];
    }

    const resumenPorMetodoPago = new Map<number, {
      nombre: string;
      valor: number;
    }>();

    for (const factura of facturasDelDia) {
      const clave = factura.metodoPagoId;
      const nombre = factura.metodoPago?.Nombre ?? 'Sin método de pago';

      const acumulado = resumenPorMetodoPago.get(clave) ?? {
        nombre,
        valor: 0,
      };

      acumulado.valor += factura.Total;

      resumenPorMetodoPago.set(clave, acumulado);
    }

    return Array.from(resumenPorMetodoPago.values()).map(item => new ResumenDelDiaMetodoPago(item));
  }

  @get('/metodo-pago')
  @response(200, {
    description: 'Array of MetodoPago model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(MetodoPago, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(MetodoPago) filter?: Filter<MetodoPago>,
  ): Promise<MetodoPago[]> {
    return this.metodoPagoRepository.find(filter);
  }

  @patch('/metodo-pago')
  @response(200, {
    description: 'MetodoPago PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MetodoPago, {partial: true}),
        },
      },
    })
    metodoPago: MetodoPago,
    @param.where(MetodoPago) where?: Where<MetodoPago>,
  ): Promise<Count> {
    return this.metodoPagoRepository.updateAll(metodoPago, where);
  }

  @get('/metodo-pago/{id}')
  @response(200, {
    description: 'MetodoPago model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(MetodoPago, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(MetodoPago, {exclude: 'where'}) filter?: FilterExcludingWhere<MetodoPago>
  ): Promise<MetodoPago> {
    return this.metodoPagoRepository.findById(id, filter);
  }

  @patch('/metodo-pago/{id}')
  @response(204, {
    description: 'MetodoPago PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MetodoPago, {partial: true}),
        },
      },
    })
    metodoPago: MetodoPago,
  ): Promise<void> {
    await this.metodoPagoRepository.updateById(id, metodoPago);
  }

  @put('/metodo-pago/{id}')
  @response(204, {
    description: 'MetodoPago PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() metodoPago: MetodoPago,
  ): Promise<void> {
    await this.metodoPagoRepository.replaceById(id, metodoPago);
  }

  @del('/metodo-pago/{id}')
  @response(204, {
    description: 'MetodoPago DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.metodoPagoRepository.deleteById(id);
  }
}
