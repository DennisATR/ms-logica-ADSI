import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Proveedor, ProveedorRelations, Zapato, Cuenta} from '../models';
import {ZapatoRepository} from './zapato.repository';
import {CuentaRepository} from './cuenta.repository';

export class ProveedorRepository extends DefaultCrudRepository<
  Proveedor,
  typeof Proveedor.prototype.id,
  ProveedorRelations
> {

  public readonly zapatos: HasManyRepositoryFactory<Zapato, typeof Proveedor.prototype.id>;

  public readonly cuentas: HasManyRepositoryFactory<Cuenta, typeof Proveedor.prototype.id>;

  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource, @repository.getter('ZapatoRepository') protected zapatoRepositoryGetter: Getter<ZapatoRepository>, @repository.getter('CuentaRepository') protected cuentaRepositoryGetter: Getter<CuentaRepository>,
  ) {
    super(Proveedor, dataSource);
    this.cuentas = this.createHasManyRepositoryFactoryFor('cuentas', cuentaRepositoryGetter,);
    this.registerInclusionResolver('cuentas', this.cuentas.inclusionResolver);
    this.zapatos = this.createHasManyRepositoryFactoryFor('zapatos', zapatoRepositoryGetter,);
    this.registerInclusionResolver('zapatos', this.zapatos.inclusionResolver);
  }
}
