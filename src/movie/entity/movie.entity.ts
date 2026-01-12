import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BaseTable } from './base-table.entity';
import { MovieDetail } from './movie-detail.entity';

// ManyToOne Director  -> 감독은 여러개의 영화를 만들 수 있음
// OneToMany -> 영화는 하나의 상세 내용을 갖을 수 있음
// ManyToMany -> 영화는 여러개의 장르를 갖을 수 있음 장르는 여러개의 영화를 갖을 수 있음
@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;

  @OneToOne(() => MovieDetail, (movieDetail) => movieDetail.id, {
    cascade: true,
  })
  @JoinColumn()
  detail: MovieDetail;
}
