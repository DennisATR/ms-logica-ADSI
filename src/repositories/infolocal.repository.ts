import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Infolocal, InfolocalRelations} from '../models';

export class InfolocalRepository extends DefaultCrudRepository<
  Infolocal,
  typeof Infolocal.prototype.id,
  InfolocalRelations
> {
  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource,
  ) {
    super(Infolocal, dataSource);
  }
}
