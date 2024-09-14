import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyThroughRepositoryFactory, HasManyRepositoryFactory} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Factura, FacturaRelations, MetodoPago, Zapato, Venta, Credito, Cliente} from '../models';
import {MetodoPagoRepository} from './metodo-pago.repository';
import {VentaRepository} from './venta.repository';
import {ZapatoRepository} from './zapato.repository';
import {CreditoRepository} from './credito.repository';
import {ClienteRepository} from './cliente.repository';

export class FacturaRepository extends DefaultCrudRepository<
  Factura,
  typeof Factura.prototype.id,
  FacturaRelations
> {

  public readonly metodoPago: BelongsToAccessor<MetodoPago, typeof Factura.prototype.id>;

  public readonly zapatos: HasManyThroughRepositoryFactory<Zapato, typeof Zapato.prototype.id,
          Venta,
          typeof Factura.prototype.id
        >;

  public readonly creditos: HasManyRepositoryFactory<Credito, typeof Factura.prototype.id>;

  public readonly cliente: BelongsToAccessor<Cliente, typeof Factura.prototype.id>;

  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource, @repository.getter('MetodoPagoRepository') protected metodoPagoRepositoryGetter: Getter<MetodoPagoRepository>, @repository.getter('VentaRepository') protected ventaRepositoryGetter: Getter<VentaRepository>, @repository.getter('ZapatoRepository') protected zapatoRepositoryGetter: Getter<ZapatoRepository>, @repository.getter('CreditoRepository') protected creditoRepositoryGetter: Getter<CreditoRepository>, @repository.getter('ClienteRepository') protected clienteRepositoryGetter: Getter<ClienteRepository>,
  ) {
    super(Factura, dataSource);
    this.cliente = this.createBelongsToAccessorFor('cliente', clienteRepositoryGetter,);
    this.registerInclusionResolver('cliente', this.cliente.inclusionResolver);
    this.creditos = this.createHasManyRepositoryFactoryFor('creditos', creditoRepositoryGetter,);
    this.registerInclusionResolver('creditos', this.creditos.inclusionResolver);
    this.zapatos = this.createHasManyThroughRepositoryFactoryFor('zapatos', zapatoRepositoryGetter, ventaRepositoryGetter,);
    this.registerInclusionResolver('zapatos', this.zapatos.inclusionResolver);
    this.metodoPago = this.createBelongsToAccessorFor('metodoPago', metodoPagoRepositoryGetter,);
    this.registerInclusionResolver('metodoPago', this.metodoPago.inclusionResolver);
  }
}
