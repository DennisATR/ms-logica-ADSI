import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Vendedor, VendedorRelations, Pago, Factura} from '../models';
import {PagoRepository} from './pago.repository';
import {FacturaRepository} from './factura.repository';

export class VendedorRepository extends DefaultCrudRepository<
  Vendedor,
  typeof Vendedor.prototype.id,
  VendedorRelations
> {

  public readonly pagos: HasManyRepositoryFactory<Pago, typeof Vendedor.prototype.id>;

  public readonly facturas: HasManyRepositoryFactory<Factura, typeof Vendedor.prototype.id>;

  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource, @repository.getter('PagoRepository') protected pagoRepositoryGetter: Getter<PagoRepository>, @repository.getter('FacturaRepository') protected facturaRepositoryGetter: Getter<FacturaRepository>,
  ) {
    super(Vendedor, dataSource);
    this.facturas = this.createHasManyRepositoryFactoryFor('facturas', facturaRepositoryGetter,);
    this.registerInclusionResolver('facturas', this.facturas.inclusionResolver);
    this.pagos = this.createHasManyRepositoryFactoryFor('pagos', pagoRepositoryGetter,);
    this.registerInclusionResolver('pagos', this.pagos.inclusionResolver);
  }

  public async generarIdVendedor(fecha: string): Promise<string> {
    const año = fecha.substring(0, 4);
    const dia = fecha.substring(8, 10);
    const mes = fecha.substring(5, 7);
    const prefijo = año + dia + mes;
    const ultimoVendedor = await this.findOne({
      where: {
        id: {like: `${prefijo}%`}
      },
      order: ['id DESC']
    });

    let secuencial = 1;
    if (ultimoVendedor && ultimoVendedor.id) {
      const ultimoSecuencial = parseInt(ultimoVendedor.id.slice(-2));
      secuencial = ultimoSecuencial + 1;
    }
    const secuencialStr = secuencial.toString().padStart(2, '0');
    return prefijo + secuencialStr;
  }
}
