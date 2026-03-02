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
import {Zapato, ZapatoSerie, ZapatoUnidad} from '../models';
import {AlmacenRepository, ZapatoRepository} from '../repositories';
import {StickerService} from '../services';

export class ZapatoController {
  constructor(
    @repository(ZapatoRepository)
    public zapatoRepository: ZapatoRepository,
    @service(StickerService)
    public stickerService: StickerService,
    @repository(AlmacenRepository)
    public almacenRepository: AlmacenRepository,
  ) { }

  @post('/zapato')
  @response(200, {
    description: 'Zapato model instance',
    content: {'application/json': {schema: getModelSchemaRef(Zapato)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ZapatoUnidad, {
            title: 'NewZapato'
          }),
        },
      },
    })
    data: ZapatoUnidad,
  ): Promise<Zapato> {
    // Obtener el prefijo del almacén para generar el ID del zapato
    const almacenes = await this.almacenRepository.find({limit: 1});
    if (almacenes.length === 0) {
      throw new HttpErrors.BadRequest('No hay almacenes disponibles para generar el ID del zapato.');
    }
    const prefijoAlmacen = almacenes[0].Prefijo

    // Extraer la descripción y categoría para generar el prefijo
    const {Descripcion, Categoria, Talla, id, Referencia, PrecioVentaMax, PrecioVentaMin, ...commonData} = data;

    let zapatoConId;
    // Decodificar la referencia en Base64 para obtener el precio
    let precioDecodificado: number;
    try {
      precioDecodificado = parseInt(atob(Referencia));
      if (isNaN(precioDecodificado)) throw new Error();
    } catch {
      throw new HttpErrors.BadRequest('Referencia inválida.');
    }

    if (PrecioVentaMax < PrecioVentaMin) {
      throw new HttpErrors.BadRequest('El precio de venta mínimo no puede ser mayor que el máximo.');
    }

    // Si el ID no es proporcionado, generarlo
    if (id) {
      // Si el ID es proporcionado, lo usamos tal cual
      zapatoConId = {
        id: id,
        Descripcion: Descripcion,
        Categoria: Categoria,
        Talla: Talla,
        PrecioCosto: precioDecodificado,
        PrecioVentaMax: PrecioVentaMax,
        PrecioVentaMin: PrecioVentaMin,
        ...commonData,
      };
    } else {

      // Generar el ID si no fue proporcionado
      const prefijoDescripcion = Descripcion.substring(0, 3).toUpperCase();
      const prefijoCategoria = Categoria.substring(0, 3).toUpperCase();

      // Obtener el consecutivo
      const consecutivo = await this.obtenerConsecutivo(prefijoDescripcion, prefijoCategoria);

      // Generar el ID para el zapato individual
      const generatedId = `${prefijoAlmacen}${prefijoDescripcion}${prefijoCategoria}${consecutivo}${Talla}`;

      zapatoConId = {
        id: generatedId,
        Descripcion: Descripcion,
        Categoria: Categoria,
        Talla: Talla,
        PrecioCosto: precioDecodificado,
        PrecioVentaMax: PrecioVentaMax,
        PrecioVentaMin: PrecioVentaMin,
        ...commonData,
      };
    }
    // Crear el zapato con el ID generado o proporcionado
    return this.zapatoRepository.create(zapatoConId)
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


  @get('/zapato/referencia/{id}')
  @response(200, {
    description: 'Referencia (PrecioCosto en Base64) de un zapato',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            referencia: {type: 'string'},
          },
        },
      },
    },
  })
  async findByReferencia(
    @param.path.string('id') id: string,
  ): Promise<{referencia: string}> {
    const zapato = await this.zapatoRepository.findById(id);

    // Convertir PrecioCosto a Base64
    const referencia = Buffer.from(zapato.PrecioCosto.toString()).toString('base64');

    return {referencia};
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
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ZapatoUnidad, {
            title: 'UpdateZapato',
          }),
        },
      },
    })
    data: ZapatoUnidad,
  ): Promise<void> {
    const {Descripcion, Categoria, Talla, Referencia, PrecioVentaMax, PrecioVentaMin, ...commonData} = data;

    // Decodificar referencia en Base64
    let precioDecodificado: number;
    try {
      precioDecodificado = parseInt(atob(Referencia));
      if (isNaN(precioDecodificado)) throw new Error();
    } catch {
      throw new HttpErrors.BadRequest('Referencia inválida.');
    }

    if (PrecioVentaMax < PrecioVentaMin) {
      throw new HttpErrors.BadRequest('El precio de venta mínimo no puede ser mayor que el máximo.');
    }

    // Construir objeto actualizado
    const zapatoActualizado: Partial<Zapato> = {
      id,
      Descripcion,
      Categoria,
      Talla,
      PrecioCosto: precioDecodificado ?? 0,
      PrecioVentaMax: PrecioVentaMax,
      PrecioVentaMin: PrecioVentaMin,
      ...commonData,
    };

    await this.zapatoRepository.replaceById(id, zapatoActualizado);
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
    const {TallaInicial, TallaFinal, Cantidad, Descripcion, Categoria, Referencia, Prefijo, PrecioVentaMax, PrecioVentaMin, ...commonData} = data;

    if (TallaInicial > TallaFinal) {
      throw new HttpErrors.BadRequest('La talla inicial no puede ser mayor que la talla final.');
    }

    if (PrecioVentaMax < PrecioVentaMin) {
      throw new HttpErrors.BadRequest('El precio de venta mínimo no puede ser mayor que el máximo.');
    }

    const zapatosCreados: Zapato[] = [];
    const totalTallas = TallaFinal - TallaInicial + 1;

    let cantidades: number[] = [];
    if (Array.isArray(Cantidad)) {
      cantidades = Cantidad.concat(Array(totalTallas - Cantidad.length).fill(1));
    } else if (typeof Cantidad === 'number') {
      cantidades = Array(totalTallas).fill(Cantidad);
    } else {
      throw new HttpErrors.BadRequest('El campo Cantidad debe ser un número o una serie de números separados por "," .');
    }

    let precioDecodificado: number;
    try {
      precioDecodificado = parseInt(atob(Referencia));
      if (isNaN(precioDecodificado)) throw new Error();
    } catch {
      throw new HttpErrors.BadRequest('Referencia inválida.');
    }

    let prefijoFinal = Prefijo;
    if (!prefijoFinal) {
      const prefijoDescripcion = Descripcion.substring(0, 3).toUpperCase();
      const prefijoCategoria = Categoria.substring(0, 3).toUpperCase();
      const consecutivo = await this.obtenerConsecutivo(prefijoDescripcion, prefijoCategoria);
      prefijoFinal = `${prefijoDescripcion}${prefijoCategoria}${consecutivo}`;
    }

    for (let i = 0; i < totalTallas; i++) {
      const talla = TallaInicial + i;
      const id = `${prefijoFinal}${talla}`;

      const zapatoData = {
        id,
        Descripcion,
        Categoria,
        Talla: talla,
        Cantidad: cantidades[i],
        PrecioCosto: precioDecodificado,
        PrecioVentaMax: PrecioVentaMax,
        PrecioVentaMin: PrecioVentaMin,
        ...commonData,
      };

      try {
        const nuevoZapato = await this.zapatoRepository.create(zapatoData);
        zapatosCreados.push(nuevoZapato);
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          throw new HttpErrors.UnprocessableEntity(`El zapato con ID '${id}' ya existe en la base de datos.`);
        }
        throw new HttpErrors.InternalServerError(`Error al crear zapato con talla ${talla}.`);
      }
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
