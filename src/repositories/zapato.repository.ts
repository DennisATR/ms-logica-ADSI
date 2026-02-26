import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyThroughRepositoryFactory, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Zapato, ZapatoRelations, Factura, Venta, Proveedor} from '../models';
import {VentaRepository} from './venta.repository';
import {FacturaRepository} from './factura.repository';
import {ProveedorRepository} from './proveedor.repository';

export class ZapatoRepository extends DefaultCrudRepository<
  Zapato,
  typeof Zapato.prototype.id,
  ZapatoRelations
> {

  public readonly facturas: HasManyThroughRepositoryFactory<Factura, typeof Factura.prototype.id,
          Venta,
          typeof Zapato.prototype.id
        >;

  public readonly proveedor: BelongsToAccessor<Proveedor, typeof Zapato.prototype.id>;

  public readonly ventas: HasManyRepositoryFactory<Venta, typeof Zapato.prototype.id>;

  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource, @repository.getter('VentaRepository') protected ventaRepositoryGetter: Getter<VentaRepository>, @repository.getter('FacturaRepository') protected facturaRepositoryGetter: Getter<FacturaRepository>, @repository.getter('ProveedorRepository') protected proveedorRepositoryGetter: Getter<ProveedorRepository>,
  ) {
    super(Zapato, dataSource);
    this.ventas = this.createHasManyRepositoryFactoryFor('ventas', ventaRepositoryGetter,);
    this.registerInclusionResolver('ventas', this.ventas.inclusionResolver);
    this.proveedor = this.createBelongsToAccessorFor('proveedor', proveedorRepositoryGetter,);
    this.registerInclusionResolver('proveedor', this.proveedor.inclusionResolver);
    this.facturas = this.createHasManyThroughRepositoryFactoryFor('facturas', facturaRepositoryGetter, ventaRepositoryGetter,);
    this.registerInclusionResolver('facturas', this.facturas.inclusionResolver);
  }
}
