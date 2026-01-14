import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Director } from 'src/director/entity/director.entity';
import { DirectorModule } from 'src/director/director.module';
import { Genre } from 'src/genre/entity/genre.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movie, MovieDetail, Director, Genre]),
    DirectorModule,
    AuthModule,
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
