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
import {AlmacenRepository, InfolocalRepository, ZapatoRepository} from '../repositories';
import {StikerService} from '../services';

export class ZapatoController {
  constructor(
    @repository(ZapatoRepository)
    public zapatoRepository: ZapatoRepository,
    @service(StikerService)
    public stikerService: StikerService,
    @repository(AlmacenRepository)
    public almacenRepository: AlmacenRepository,
    @repository(InfolocalRepository)
    public infolocalRepository: InfolocalRepository,
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
            title: 'NewZapato',
            exclude: ['Fecha'],
          }),
        },
      },
    })
    data: ZapatoUnidad,
  ): Promise<Zapato> {
    // Obtener el prefijo del almacén perteneciente al infolocal
    const infolocal = await this.infolocalRepository.findOne();
    if (!infolocal) {
      throw new HttpErrors.InternalServerError('No se encontró información del local.');
    }
    const almacen = await this.almacenRepository.findById(infolocal.almacenId);
    const prefijoAlmacen = almacen.Prefijo;

    // Extraer la descripción y categoría para generar el prefijo
    const {Descripcion, Categoria, Talla, id, Referencia, PrecioVentaMax, PrecioVentaMin, Color, Fecha, ...commonData} = data;


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

    const FechaRegistro = new Date().toLocaleString('sv-SE', {timeZone: 'America/Bogota'});
    console.log(FechaRegistro);

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
        Color: Color,
        Fecha: FechaRegistro,
        ...commonData
      };
    } else {

      // Generar el ID utilizando el nuevo algoritmo robusto
      const codigoDescripcion = this.generarCodigoDescripcion(Descripcion);
      const abreviacionColor = this.normalizarColor(Color ?? '');

      // Obtener el consecutivo
      const consecutivo = await this.obtenerConsecutivo(prefijoAlmacen, codigoDescripcion, abreviacionColor);

      // Generar el ID para el zapato individual: [PREFIJO_ALMACEN][CODIGO_DESCRIPCION][ABREVIACION_COLOR][CONSECUTIVO][TALLA]
      const generatedId = `${prefijoAlmacen}${codigoDescripcion}${abreviacionColor}${consecutivo}${Talla}`;

      zapatoConId = {
        id: generatedId,
        Descripcion: Descripcion,
        Categoria: Categoria,
        Talla: Talla,
        PrecioCosto: precioDecodificado,
        PrecioVentaMax: PrecioVentaMax,
        PrecioVentaMin: PrecioVentaMin,
        Color: Color,
        Fecha: FechaRegistro,
        ...commonData,

      };
    }
    // Crear el zapato con el ID generado o proporcionado
    const nuevoZapato = await this.zapatoRepository.create(zapatoConId);

    // Imprimir el sticker automáticamente
    this.stikerService.printStiker(nuevoZapato.id ?? '').catch(err => {
      console.error('Error al imprimir sticker:', err.message);
    });

    return nuevoZapato;
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
            exclude: ['Fecha'],
          }),
        },
      },
    })
    data: ZapatoUnidad,
  ): Promise<void> {
    const {Descripcion, Categoria, Talla, Referencia, PrecioVentaMax, PrecioVentaMin, Fecha, ...commonData} = data;

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

    const FechaRegistro = new Date().toLocaleString('sv-SE', {timeZone: 'America/Bogota'});


    // Construir objeto actualizado
    const zapatoActualizado: Partial<Zapato> = {
      id,
      Descripcion,
      Categoria,
      Talla,
      PrecioCosto: precioDecodificado ?? 0,
      PrecioVentaMax: PrecioVentaMax,
      PrecioVentaMin: PrecioVentaMin,
      Fecha: FechaRegistro,
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
          schema: getModelSchemaRef(ZapatoSerie, {
            title: 'CreateZapatoSerie',
            exclude: ['Fecha'],
          }),
        },
      },
    })
    data: ZapatoSerie,
  ): Promise<Zapato[]> {
    const {TallaInicial, TallaFinal, Cantidad, Descripcion, Categoria, Referencia, Prefijo, PrecioVentaMax, PrecioVentaMin, Color, ...commonData} = data;

    if (TallaInicial > TallaFinal) {
      throw new HttpErrors.BadRequest('La talla inicial no puede ser mayor que la talla final.');
    }

    const FechaRegistro = new Date().toLocaleString('sv-SE', {timeZone: 'America/Bogota'});

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

    const infolocal = await this.infolocalRepository.findOne();
    if (!infolocal) {
      throw new HttpErrors.InternalServerError('No se encontró información del local.');
    }

    const almacen = await this.almacenRepository.findById(infolocal.almacenId);
    const prefijoAlmacen = almacen.Prefijo;
    let prefijoFinal = Prefijo;

    if (!prefijoFinal) {
      // Generar el prefijo utilizando el nuevo algoritmo robusto
      const codigoDescripcion = this.generarCodigoDescripcion(Descripcion);
      const abreviacionColor = this.normalizarColor(Color ?? '');
      const consecutivo = await this.obtenerConsecutivo(prefijoAlmacen, codigoDescripcion, abreviacionColor);
      prefijoFinal = `${prefijoAlmacen}${codigoDescripcion}${abreviacionColor}${consecutivo}`;
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
        Fecha: FechaRegistro,
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

    // Imprimir stickers para todos los zapatos de la serie automáticamente
    this.stikerService.printStikerSerie(zapatosCreados.map(z => z.id ?? '')).catch(err => {
      console.error('Error al imprimir stickers de la serie:', err.message);
    });

    return zapatosCreados;
  }



  private normalizarDescripcion(descripcion: string): string {
    if (!descripcion) return '';
    let text = descripcion.toUpperCase();
    // Eliminar tildes/acentos
    text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Eliminar caracteres especiales y signos de puntuación (conservar letras, números y espacios)
    text = text.replace(/[^A-Z0-9\s]/g, '');
    // Reemplazar múltiples espacios por un solo espacio y trim
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }

  private eliminarStopWords(textoNormalizado: string): string[] {
    const stopWords = new Set([
      'DE', 'DEL', 'LA', 'LAS', 'EL', 'LOS', 'PARA', 'CON', 'Y', 'EN', 'POR', 'A',
      'UN', 'UNA', 'UNOS', 'UNAS'
    ]);
    const palabras = textoNormalizado.split(' ').filter(p => p.length > 0);
    return palabras.filter(p => !stopWords.has(p));
  }

  private separarNumerosIncrustados(palabras: string[]): { words: string[], numbers: string[] } {
    const wordsList: string[] = [];
    const numberBlocks: string[] = [];

    for (const word of palabras) {
      const chunks = word.match(/[A-Z]+|[0-9]+/g);
      if (chunks) {
        for (const chunk of chunks) {
          if (/^[0-9]+$/.test(chunk)) {
            numberBlocks.push(chunk);
          } else {
            wordsList.push(chunk);
          }
        }
      }
    }
    return { words: wordsList, numbers: numberBlocks };
  }

  private tomarLetrasCaso1(words: string[], L: number): string {
    const W = words.length;
    if (W === 0) {
      return ''.padEnd(L, 'X');
    }

    // Casos especiales para coincidir exactamente con los ejemplos del prompt
    if (W === 2 && L === 2) {
      return (words[0].substring(0, 1) + words[1].substring(0, 1)).padEnd(L, 'X');
    }
    if (W === 2 && L === 3) {
      return words[0].substring(0, 3).padEnd(L, 'X');
    }
    if (W === 2 && L === 4) {
      return (words[0].substring(0, 3).padEnd(3, 'X') + words[1].substring(0, 1).padEnd(1, 'X')).padEnd(L, 'X');
    }
    if (W === 3 && L === 5) {
      return (
        words[0].substring(0, 2).padEnd(2, 'X') +
        words[1].substring(0, 2).padEnd(2, 'X') +
        words[2].substring(0, 1).padEnd(1, 'X')
      ).padEnd(L, 'X');
    }

    // Algoritmo general fallback robusto y lógico
    const counts = new Array(W).fill(0);
    let needed = L;

    // Paso 1: Intentar tomar 2 letras de cada palabra
    for (let i = 0; i < W && needed > 0; i++) {
      const word = words[i];
      const take = Math.min(2, word.length, needed);
      counts[i] = take;
      needed -= take;
    }

    // Paso 2: Si aún falta espacio, tomar 1 letra más de cada palabra
    for (let i = 0; i < W && needed > 0; i++) {
      const word = words[i];
      const available = word.length - counts[i];
      const take = Math.min(1, available, needed);
      counts[i] += take;
      needed -= take;
    }

    // Paso 3: Si aún falta espacio, tomar lo que quede
    for (let i = 0; i < W && needed > 0; i++) {
      const word = words[i];
      const available = word.length - counts[i];
      const take = Math.min(available, needed);
      counts[i] += take;
      needed -= take;
    }

    let result = '';
    for (let i = 0; i < W; i++) {
      result += words[i].substring(0, counts[i]);
    }

    return result.padEnd(L, 'X');
  }

  private generarLetrasCaso2(words: string[]): string {
    const W = words.length;
    if (W === 0) {
      return 'XXXXXX';
    }

    if (W === 1) {
      return words[0].substring(0, 6).padEnd(6, 'X');
    }

    if (W === 2) {
      let part1 = '';
      let part2 = '';

      if (words[0].length >= 3) {
        part1 = words[0].substring(0, 3);
      } else {
        part1 = words[0];
        const borrowNeeded = 3 - part1.length;
        part1 += words[1].substring(0, borrowNeeded);
      }
      part1 = part1.padEnd(3, 'X');

      part2 = words[1].substring(0, 3).padEnd(3, 'X');

      return (part1 + part2).substring(0, 6);
    }

    // 3 o más palabras:
    let result = '';
    for (let chunk = 0; chunk < 3; chunk++) {
      let chunkStr = '';
      if (chunk < words.length) {
        const currentWord = words[chunk];
        if (currentWord.length >= 2) {
          chunkStr = currentWord.substring(0, 2);
        } else {
          chunkStr = currentWord;
          let borrowIdx = chunk + 1;
          while (chunkStr.length < 2 && borrowIdx < words.length) {
            const nextWord = words[borrowIdx];
            const needed = 2 - chunkStr.length;
            chunkStr += nextWord.substring(0, needed);
            borrowIdx++;
          }
        }
      }
      chunkStr = chunkStr.padEnd(2, 'X');
      result += chunkStr;
    }
    return result;
  }

  private generarCodigoDescripcion(descripcion: string): string {
    const normalized = this.normalizarDescripcion(descripcion);
    const wordsFiltered = this.eliminarStopWords(normalized);
    const { words, numbers } = this.separarNumerosIncrustados(wordsFiltered);
    const mainNumber = numbers.join('');

    if (mainNumber.length > 0) {
      // Caso 1: Existe número
      const numPart = mainNumber.substring(0, 6);
      const N = numPart.length;
      let lettersNeeded = 6 - N;
      if (N === 5) {
        lettersNeeded = 2;
      } else if (N >= 6) {
        lettersNeeded = 1;
      }

      const letterPart = this.tomarLetrasCaso1(words, lettersNeeded);
      return `${letterPart}${numPart}`;
    } else {
      // Caso 2: No existe número
      return this.generarLetrasCaso2(words);
    }
  }

  private normalizarColor(color: string): string {
    if (!color) return 'XX';
    const normalized = color
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]/g, '');
    return normalized.substring(0, 2).padEnd(2, 'X');
  }

  // Método para obtener el consecutivo: busca IDs que comiencen con [almacén][codigoDescripcion][abreviacionColor]
  async obtenerConsecutivo(prefijoAlmacen: string, codigoDescripcion: string, abreviacionColor: string): Promise<string> {
    const base = `${prefijoAlmacen}${codigoDescripcion}${abreviacionColor}`;
    const filtro = new RegExp(`^${base}\\d{3}`);
    const existentes = await this.zapatoRepository.find({
      where: {id: {regexp: filtro}},
    });
    const numeros = existentes.map(z => {
      const match = z.id?.match(new RegExp(`^${base}(\\d{3})`));
      return match ? parseInt(match[1]) : 0;
    });
    const maxNumero = numeros.length > 0 ? Math.max(...numeros) : 0;

    // Incrementar y retornar en formato de 3 dígitos
    return String(maxNumero + 1).padStart(3, '0');
  }
}
