import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import {MenuDelRol} from '../models';
import {MenuDelRolRepository} from '../repositories';

export class MenuDelRolController {
  constructor(
    @repository(MenuDelRolRepository)
    public menuDelRolRepository : MenuDelRolRepository,
  ) {}

  @post('/menu-del-rol')
  @response(200, {
    description: 'MenuDelRol model instance',
    content: {'application/json': {schema: getModelSchemaRef(MenuDelRol)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MenuDelRol, {
            title: 'NewMenuDelRol',
            exclude: ['id'],
          }),
        },
      },
    })
    menuDelRol: Omit<MenuDelRol, 'id'>,
  ): Promise<MenuDelRol> {
    return this.menuDelRolRepository.create(menuDelRol);
  }

  @get('/menu-del-rol/count')
  @response(200, {
    description: 'MenuDelRol model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(MenuDelRol) where?: Where<MenuDelRol>,
  ): Promise<Count> {
    return this.menuDelRolRepository.count(where);
  }

  @get('/menu-del-rol')
  @response(200, {
    description: 'Array of MenuDelRol model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(MenuDelRol, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(MenuDelRol) filter?: Filter<MenuDelRol>,
  ): Promise<MenuDelRol[]> {
    return this.menuDelRolRepository.find(filter);
  }

  @patch('/menu-del-rol')
  @response(200, {
    description: 'MenuDelRol PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MenuDelRol, {partial: true}),
        },
      },
    })
    menuDelRol: MenuDelRol,
    @param.where(MenuDelRol) where?: Where<MenuDelRol>,
  ): Promise<Count> {
    return this.menuDelRolRepository.updateAll(menuDelRol, where);
  }

  @get('/menu-del-rol/{id}')
  @response(200, {
    description: 'MenuDelRol model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(MenuDelRol, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(MenuDelRol, {exclude: 'where'}) filter?: FilterExcludingWhere<MenuDelRol>
  ): Promise<MenuDelRol> {
    return this.menuDelRolRepository.findById(id, filter);
  }

  @patch('/menu-del-rol/{id}')
  @response(204, {
    description: 'MenuDelRol PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MenuDelRol, {partial: true}),
        },
      },
    })
    menuDelRol: MenuDelRol,
  ): Promise<void> {
    await this.menuDelRolRepository.updateById(id, menuDelRol);
  }

  @put('/menu-del-rol/{id}')
  @response(204, {
    description: 'MenuDelRol PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() menuDelRol: MenuDelRol,
  ): Promise<void> {
    await this.menuDelRolRepository.replaceById(id, menuDelRol);
  }

  @del('/menu-del-rol/{id}')
  @response(204, {
    description: 'MenuDelRol DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.menuDelRolRepository.deleteById(id);
  }
}
