import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Venta, VentaRelations, Devolucion, Pendiente} from '../models';
import {DevolucionRepository} from './devolucion.repository';
import {PendienteRepository} from './pendiente.repository';

export class VentaRepository extends DefaultCrudRepository<
  Venta,
  typeof Venta.prototype.id,
  VentaRelations
> {

  public readonly devolucions: HasManyRepositoryFactory<Devolucion, typeof Venta.prototype.id>;

  public readonly pendientes: HasManyRepositoryFactory<Pendiente, typeof Venta.prototype.id>;

  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource, @repository.getter('DevolucionRepository') protected devolucionRepositoryGetter: Getter<DevolucionRepository>, @repository.getter('PendienteRepository') protected pendienteRepositoryGetter: Getter<PendienteRepository>,
  ) {
    super(Venta, dataSource);
    this.pendientes = this.createHasManyRepositoryFactoryFor('pendientes', pendienteRepositoryGetter,);
    this.registerInclusionResolver('pendientes', this.pendientes.inclusionResolver);
    this.devolucions = this.createHasManyRepositoryFactoryFor('devolucions', devolucionRepositoryGetter,);
    this.registerInclusionResolver('devolucions', this.devolucions.inclusionResolver);
  }
}
