import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Gastos, GastosRelations} from '../models';

export class GastosRepository extends DefaultCrudRepository<
  Gastos,
  typeof Gastos.prototype.id,
  GastosRelations
> {
  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource,
  ) {
    super(Gastos, dataSource);
  }
}
