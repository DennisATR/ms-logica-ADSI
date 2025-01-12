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
import {Zapato, ZapatoSerie} from '../models';
import {ZapatoRepository} from '../repositories';
import {StickerService} from '../services';

export class ZapatoController {
  constructor(
    @repository(ZapatoRepository)
    public zapatoRepository : ZapatoRepository,
    @service(StickerService)
    public stickerService: StickerService
  ) {}

  @post('/zapato')
  @response(200, {
    description: 'Zapato model instance',
    content: {'application/json': {schema: getModelSchemaRef(Zapato)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Zapato, {
            title: 'NewZapato'
          }),
        },
      },
    })
    zapato: Zapato,
  ): Promise<Zapato> {
    // Extraer la descripción y categoría para generar el prefijo
    const { Descripcion, Categoria, Talla, id, ...commonData } = zapato;

    let zapatoConId;

    // Si el ID no es proporcionado, generarlo
    if (id) {
      // Si el ID es proporcionado, lo usamos tal cual
      zapatoConId = {
        ...zapato,
        id: id,
      };
    } else {
      // Generar el ID si no fue proporcionado
      const prefijoDescripcion = Descripcion.substring(0, 3).toUpperCase();
      const prefijoCategoria = Categoria.substring(0, 3).toUpperCase();

      // Obtener el consecutivo
      const consecutivo = await this.obtenerConsecutivo(prefijoDescripcion, prefijoCategoria);

      // Generar el ID para el zapato individual
      const generatedId = `${prefijoDescripcion}${prefijoCategoria}${consecutivo}${Talla}`;

      zapatoConId = {
        ...zapato,
        id: generatedId,
      };
    }
    const zapatoInstance = new Zapato(zapatoConId);
    const filepath = this.stickerService.generarSticker(zapatoInstance);
    console.log(filepath);

    // Crear el zapato con el ID generado o proporcionado
    return this.zapatoRepository.create(zapatoConId);
  }

  @get('/zapato/count')
  @response(200, {
    description: 'Zapato model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Zapato) where?: Where<Zapato>,
  ): Promise<Count> {
    return this.zapatoRepository.count(where);
  }

  @get('/zapato')
  @response(200, {
    description: 'Array of Zapato model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Zapato, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Zapato) filter?: Filter<Zapato>,
  ): Promise<Zapato[]> {
    return this.zapatoRepository.find(filter);
  }

  @patch('/zapato')
  @response(200, {
    description: 'Zapato PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Zapato, {partial: true}),
        },
      },
    })
    zapato: Zapato,
    @param.where(Zapato) where?: Where<Zapato>,
  ): Promise<Count> {
    return this.zapatoRepository.updateAll(zapato, where);
  }

  @get('/zapato/{id}')
  @response(200, {
    description: 'Zapato model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Zapato, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Zapato, {exclude: 'where'}) filter?: FilterExcludingWhere<Zapato>
  ): Promise<Zapato> {
    return this.zapatoRepository.findById(id, filter);
  }

  @patch('/zapato/{id}')
  @response(204, {
    description: 'Zapato PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Zapato, {partial: true}),
        },
      },
    })
    zapato: Zapato,
  ): Promise<void> {
    await this.zapatoRepository.updateById(id, zapato);
  }

  @put('/zapato/{id}')
  @response(204, {
    description: 'Zapato PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() zapato: Zapato,
  ): Promise<void> {
    await this.zapatoRepository.replaceById(id, zapato);
  }

  @del('/zapato/{id}')
  @response(204, {
    description: 'Zapato DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.zapatoRepository.deleteById(id);
  }

  @post('/zapato/crearSerie')
  @response(200, {
    description: 'Zapato model instances (serie creada)',
    content: {'application/json': {schema: {type: 'array', items: getModelSchemaRef(Zapato)}}},
  })
  async crearSerie(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ZapatoSerie, {title: 'CreateZapatoSerie'}),
        },
      },
    })
    data: ZapatoSerie,
  ): Promise<Zapato[]> {
    const {TallaInicial, TallaFinal, Cantidad, Descripcion, Categoria, ...commonData} = data;

    if (TallaInicial > TallaFinal) {
      throw new HttpErrors.BadRequest('La talla inicial no puede ser mayor que la talla final.');
    }

    const zapatosCreados: Zapato[] = [];
    const totalTallas = TallaFinal - TallaInicial + 1;

    // Determinar cantidades para cada zapato
    let cantidades: number[] = [];
    if (Array.isArray(Cantidad)) {
      // Si `Cantidad` es un array, asignar según índice o completar con `1`
      cantidades = Cantidad.concat(Array(totalTallas - Cantidad.length).fill(1));
    } else if (typeof Cantidad === 'number') {
      // Si `Cantidad` es un número, asignar uniformemente
      cantidades = Array(totalTallas).fill(Cantidad);
    } else {
      throw new HttpErrors.BadRequest('El campo Cantidad debe ser un número o un array de números.');
    }

    // Generar consecutivo de la serie solo una vez
    const prefijoDescripcion = Descripcion.substring(0, 3).toUpperCase();
    const prefijoCategoria = Categoria.substring(0, 3).toUpperCase();
    const consecutivo = await this.obtenerConsecutivo(prefijoDescripcion, prefijoCategoria);

    for (let i = 0; i < totalTallas; i++) {
      const talla = TallaInicial + i;
      const id = `${prefijoDescripcion}${prefijoCategoria}${consecutivo}${talla}`;

      const zapatoData = {
        id: id,
        Descripcion: Descripcion,
        Categoria: Categoria,
        Talla: talla,
        Cantidad: cantidades[i],
        ...commonData,
      };

      const nuevoZapato = await this.zapatoRepository.create(zapatoData);
      zapatosCreados.push(nuevoZapato);
    }

    return zapatosCreados;
  }

  // Método para obtener el consecutivo actual basado en descripción y categoría
  async obtenerConsecutivo(prefijoDescripcion: string, prefijoCategoria: string): Promise<string> {
    const filtro = new RegExp(`^${prefijoDescripcion}${prefijoCategoria}\\d{3}`);
    const existentes = await this.zapatoRepository.find({
      where: {id: {regexp: filtro}},
    });

    const numeros = existentes
      .map(zapato => zapato.id ? parseInt(zapato.id.substring(6, 9)) : NaN)
      .filter(n => !isNaN(n));
    const maxNumero = numeros.length > 0 ? Math.max(...numeros) : 0;

    // Incrementar y retornar en formato de 3 dígitos
    return String(maxNumero + 1).padStart(3, '0');
  }
}
