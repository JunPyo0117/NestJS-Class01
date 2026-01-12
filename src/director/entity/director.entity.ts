import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaseTable } from '../../common/entity/base-table.entity';
import { Movie } from 'src/movie/entity/movie.entity';

@Entity()
export class Director extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  dob: Date;

  @Column()
  nationality: string;

  @OneToMany(() => Movie, (movie) => movie.director)
  movies: Movie[];
}
