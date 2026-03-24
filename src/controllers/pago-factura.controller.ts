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
import {PagoFactura} from '../models';
import {PagoFacturaRepository} from '../repositories';

export class PagoFacturaController {
  constructor(
    @repository(PagoFacturaRepository)
    public pagoFacturaRepository: PagoFacturaRepository,
  ) { }

  @post('/pago-factura')
  @response(200, {
    description: 'PagoFactura model instance',
    content: {'application/json': {schema: getModelSchemaRef(PagoFactura)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PagoFactura, {
            title: 'NewPagoFactura',
            exclude: ['id', 'Fecha'],
          }),
        },
      },
    })
    pagoFactura: Omit<PagoFactura, 'id'>,
  ): Promise<PagoFactura> {
    pagoFactura.Fecha = new Date().toLocaleString('sv-SE', {timeZone: 'America/Bogota'});
    return this.pagoFacturaRepository.create(pagoFactura);
  }

  @get('/pago-factura/count')
  @response(200, {
    description: 'PagoFactura model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(PagoFactura) where?: Where<PagoFactura>,
  ): Promise<Count> {
    return this.pagoFacturaRepository.count(where);
  }

  @get('/pago-factura')
  @response(200, {
    description: 'Array of PagoFactura model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(PagoFactura, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(PagoFactura) filter?: Filter<PagoFactura>,
  ): Promise<PagoFactura[]> {
    return this.pagoFacturaRepository.find(filter);
  }

  @patch('/pago-factura')
  @response(200, {
    description: 'PagoFactura PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PagoFactura, {partial: true}),
        },
      },
    })
    pagoFactura: PagoFactura,
    @param.where(PagoFactura) where?: Where<PagoFactura>,
  ): Promise<Count> {
    return this.pagoFacturaRepository.updateAll(pagoFactura, where);
  }

  @get('/pago-factura/{id}')
  @response(200, {
    description: 'PagoFactura model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(PagoFactura, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(PagoFactura, {exclude: 'where'}) filter?: FilterExcludingWhere<PagoFactura>
  ): Promise<PagoFactura> {
    return this.pagoFacturaRepository.findById(id, filter);
  }

  @patch('/pago-factura/{id}')
  @response(204, {
    description: 'PagoFactura PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PagoFactura, {partial: true}),
        },
      },
    })
    pagoFactura: PagoFactura,
  ): Promise<void> {
    await this.pagoFacturaRepository.updateById(id, pagoFactura);
  }

  @put('/pago-factura/{id}')
  @response(204, {
    description: 'PagoFactura PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() pagoFactura: PagoFactura,
  ): Promise<void> {
    await this.pagoFacturaRepository.replaceById(id, pagoFactura);
  }

  @del('/pago-factura/{id}')
  @response(204, {
    description: 'PagoFactura DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.pagoFacturaRepository.deleteById(id);
  }


  @get('/pago-factura/factura/{id}')
  @response(200, {
    description: 'Array of PagoFactura model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(PagoFactura, {includeRelations: true}),
        },
      },
    },
  })
  async findByFacturaId(
    @param.path.number('id') id: number
  ): Promise<PagoFactura[]> {
    return this.pagoFacturaRepository.find({
      where: {FacturaId: id} as Where<PagoFactura>,
    });
  }

}
