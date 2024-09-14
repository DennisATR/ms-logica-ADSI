import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Zapato, ZapatoRelations} from '../models';

export class ZapatoRepository extends DefaultCrudRepository<
  Zapato,
  typeof Zapato.prototype.id,
  ZapatoRelations
> {
  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource,
  ) {
    super(Zapato, dataSource);
  }
}
