import { Director } from './../../director/entity/director.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { BaseTable } from '../../common/entity/base-table.entity';
import { MovieDetail } from './movie-detail.entity';
import { Genre } from 'src/genre/entity/genre.entity';

// ManyToOne Director  -> 감독은 여러개의 영화를 만들 수 있음
// OneToMany movieDetail -> 영화는 하나의 상세 내용을 갖을 수 있음
// ManyToMany movieGenre -> 영화는 여러개의 장르를 갖을 수 있음 장르는 여러개의 영화를 갖을 수 있음
@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  title: string;

  @ManyToMany(() => Genre, (genre) => genre.id)
  @JoinTable()
  genres: Genre[];

  @OneToOne(() => MovieDetail, (movieDetail) => movieDetail.id, {
    cascade: true,
    nullable: false,
  })
  @JoinColumn()
  detail: MovieDetail;

  @ManyToOne(() => Director, (director) => director.id, {
    cascade: true,
    nullable: false,
  })
  director: Director;
}
