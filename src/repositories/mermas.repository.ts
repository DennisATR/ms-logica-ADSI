import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Mermas, MermasRelations} from '../models';

export class MermasRepository extends DefaultCrudRepository<
  Mermas,
  typeof Mermas.prototype.id,
  MermasRelations
> {
  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource,
  ) {
    super(Mermas, dataSource);
  }
}
