import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity()
export class BaseTable {
  @CreateDateColumn()
  @Exclude()
  @ApiHideProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @Exclude()
  @ApiHideProperty()
  updatedAt: Date;

  @VersionColumn()
  @Exclude()
  @ApiHideProperty()
  version: number;
}
