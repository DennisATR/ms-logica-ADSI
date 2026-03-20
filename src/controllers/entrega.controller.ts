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
import {Entrega, ResumenDelDiaEntregas} from '../models';
import {EntregaRepository} from '../repositories';

export class EntregaController {
  constructor(
    @repository(EntregaRepository)
    public entregaRepository: EntregaRepository,
  ) { }

  @post('/entrega')
  @response(200, {
    description: 'Entrega model instance',
    content: {'application/json': {schema: getModelSchemaRef(Entrega)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Entrega, {
            title: 'NewEntrega',
            exclude: ['id'],
          }),
        },
      },
    })
    entrega: Omit<Entrega, 'id'>,
  ): Promise<Entrega> {
    return this.entregaRepository.create(entrega);
  }

  @get('/entrega/count')
  @response(200, {
    description: 'Entrega model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Entrega) where?: Where<Entrega>,
  ): Promise<Count> {
    return this.entregaRepository.count(where);
  }

  @get('/entrega/resumen-dia/fecha/{fecha}')
  @response(200, {
    description: 'Resumen de entregas por fecha y por empresa transportista',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(ResumenDelDiaEntregas),
        },
      },
    },
  })
  async resumenEntregasPorDia(
    @param.path.string('fecha') fecha: string,
  ): Promise<ResumenDelDiaEntregas[]> {
    const soloFecha = fecha.slice(0, 10);

    const entregasDelDia = await this.entregaRepository.find({
      where: {
        Fecha: {
          like: `${soloFecha}%`,
        },
      },
    });

    if (entregasDelDia.length === 0) {
      return [];
    }

    const resumenPorEmpresa = new Map<string, {
      empresa: string;
      cantidadCajas: number;
      cobro: number;
    }>();

    for (const entrega of entregasDelDia) {
      const clave = entrega.EmpresaTrans;

      const acumulado = resumenPorEmpresa.get(clave) ?? {
        empresa: clave,
        cantidadCajas: 0,
        cobro: 0,
      };

      acumulado.cantidadCajas += entrega.NumCajas;
      acumulado.cobro += entrega.Cobro;

      resumenPorEmpresa.set(clave, acumulado);
    }

    return Array.from(resumenPorEmpresa.values()).map(item => new ResumenDelDiaEntregas(item));
  }

  @get('/entrega')
  @response(200, {
    description: 'Array of Entrega model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Entrega, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Entrega) filter?: Filter<Entrega>,
  ): Promise<Entrega[]> {
    return this.entregaRepository.find(filter);
  }

  @patch('/entrega')
  @response(200, {
    description: 'Entrega PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Entrega, {partial: true}),
        },
      },
    })
    entrega: Entrega,
    @param.where(Entrega) where?: Where<Entrega>,
  ): Promise<Count> {
    return this.entregaRepository.updateAll(entrega, where);
  }

  @get('/entrega/{id}')
  @response(200, {
    description: 'Entrega model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Entrega, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Entrega, {exclude: 'where'}) filter?: FilterExcludingWhere<Entrega>
  ): Promise<Entrega> {
    return this.entregaRepository.findById(id, filter);
  }

  @patch('/entrega/{id}')
  @response(204, {
    description: 'Entrega PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Entrega, {partial: true}),
        },
      },
    })
    entrega: Entrega,
  ): Promise<void> {
    await this.entregaRepository.updateById(id, entrega);
  }

  @put('/entrega/{id}')
  @response(204, {
    description: 'Entrega PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() entrega: Entrega,
  ): Promise<void> {
    await this.entregaRepository.replaceById(id, entrega);
  }

  @del('/entrega/{id}')
  @response(204, {
    description: 'Entrega DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.entregaRepository.deleteById(id);
  }

  @get('/entrega/buscarporfecha/{fecha}')
  @response(200, {
    description: 'Array of Entrega model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Entrega, {includeRelations: true}),
        },
      },
    },
  })
  async findByDate(
    @param.path.string('fecha') fecha: string,
  ): Promise<Entrega[]> {

    const fechaString = new Date(fecha)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    return this.entregaRepository.find({
      where: {
        Fecha: fechaString,
      },
    });
  }

}
