import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, HasManyRepositoryFactory, HasManyThroughRepositoryFactory, repository} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Cliente, Credito, Factura, FacturaRelations, PagoFactura, Vendedor, Venta, Zapato} from '../models';
import {ClienteRepository} from './cliente.repository';
import {CreditoRepository} from './credito.repository';
import {PagoFacturaRepository} from './pago-factura.repository';
import {VendedorRepository} from './vendedor.repository';
import {VentaRepository} from './venta.repository';
import {ZapatoRepository} from './zapato.repository';

export class FacturaRepository extends DefaultCrudRepository<
  Factura,
  typeof Factura.prototype.id,
  FacturaRelations
> {

  public readonly zapatos: HasManyThroughRepositoryFactory<Zapato, typeof Zapato.prototype.id,
    Venta,
    typeof Factura.prototype.id
  >;

  public readonly creditos: HasManyRepositoryFactory<Credito, typeof Factura.prototype.id>;

  public readonly cliente: BelongsToAccessor<Cliente, typeof Factura.prototype.id>;

  public readonly vendedor: BelongsToAccessor<Vendedor, typeof Factura.prototype.id>;

  public readonly ventas: HasManyRepositoryFactory<Venta, typeof Factura.prototype.id>;

  public readonly pagoFacturas: HasManyRepositoryFactory<PagoFactura, typeof Factura.prototype.id>;

  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource, @repository.getter('VentaRepository') protected ventaRepositoryGetter: Getter<VentaRepository>, @repository.getter('ZapatoRepository') protected zapatoRepositoryGetter: Getter<ZapatoRepository>, @repository.getter('CreditoRepository') protected creditoRepositoryGetter: Getter<CreditoRepository>, @repository.getter('ClienteRepository') protected clienteRepositoryGetter: Getter<ClienteRepository>, @repository.getter('VendedorRepository') protected vendedorRepositoryGetter: Getter<VendedorRepository>, @repository.getter('PagoFacturaRepository') protected pagoFacturaRepositoryGetter: Getter<PagoFacturaRepository>,
  ) {
    super(Factura, dataSource);
    this.pagoFacturas = this.createHasManyRepositoryFactoryFor('pagoFacturas', pagoFacturaRepositoryGetter,);
    this.registerInclusionResolver('pagoFacturas', this.pagoFacturas.inclusionResolver);
    this.ventas = this.createHasManyRepositoryFactoryFor('ventas', ventaRepositoryGetter,);
    this.registerInclusionResolver('ventas', this.ventas.inclusionResolver);
    this.vendedor = this.createBelongsToAccessorFor('vendedor', vendedorRepositoryGetter,);
    this.registerInclusionResolver('vendedor', this.vendedor.inclusionResolver);
    this.cliente = this.createBelongsToAccessorFor('cliente', clienteRepositoryGetter,);
    this.registerInclusionResolver('cliente', this.cliente.inclusionResolver);
    this.creditos = this.createHasManyRepositoryFactoryFor('creditos', creditoRepositoryGetter,);
    this.registerInclusionResolver('creditos', this.creditos.inclusionResolver);
    this.zapatos = this.createHasManyThroughRepositoryFactoryFor('zapatos', zapatoRepositoryGetter, ventaRepositoryGetter,);
    this.registerInclusionResolver('zapatos', this.zapatos.inclusionResolver);
  }
}
