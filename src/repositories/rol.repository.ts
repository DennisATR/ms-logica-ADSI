import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory, HasManyThroughRepositoryFactory} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Rol, RolRelations, Empleado, Menu, MenuDelRol} from '../models';
import {EmpleadoRepository} from './empleado.repository';
import {MenuDelRolRepository} from './menu-del-rol.repository';
import {MenuRepository} from './menu.repository';

export class RolRepository extends DefaultCrudRepository<
  Rol,
  typeof Rol.prototype.id,
  RolRelations
> {

  public readonly empleados: HasManyRepositoryFactory<Empleado, typeof Rol.prototype.id>;

  public readonly menus: HasManyThroughRepositoryFactory<Menu, typeof Menu.prototype.id,
          MenuDelRol,
          typeof Rol.prototype.id
        >;

  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource, @repository.getter('EmpleadoRepository') protected empleadoRepositoryGetter: Getter<EmpleadoRepository>, @repository.getter('MenuDelRolRepository') protected menuDelRolRepositoryGetter: Getter<MenuDelRolRepository>, @repository.getter('MenuRepository') protected menuRepositoryGetter: Getter<MenuRepository>,
  ) {
    super(Rol, dataSource);
    this.menus = this.createHasManyThroughRepositoryFactoryFor('menus', menuRepositoryGetter, menuDelRolRepositoryGetter,);
    this.registerInclusionResolver('menus', this.menus.inclusionResolver);
    this.empleados = this.createHasManyRepositoryFactoryFor('empleados', empleadoRepositoryGetter,);
    this.registerInclusionResolver('empleados', this.empleados.inclusionResolver);
  }
}
