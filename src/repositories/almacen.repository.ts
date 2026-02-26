import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Almacen, AlmacenRelations, Venta} from '../models';
import {VentaRepository} from './venta.repository';

export class AlmacenRepository extends DefaultCrudRepository<
  Almacen,
  typeof Almacen.prototype.id,
  AlmacenRelations
> {

  public readonly ventas: HasManyRepositoryFactory<Venta, typeof Almacen.prototype.id>;

  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource, @repository.getter('VentaRepository') protected ventaRepositoryGetter: Getter<VentaRepository>,
  ) {
    super(Almacen, dataSource);
    this.ventas = this.createHasManyRepositoryFactoryFor('ventas', ventaRepositoryGetter,);
    this.registerInclusionResolver('ventas', this.ventas.inclusionResolver);
  }
}
