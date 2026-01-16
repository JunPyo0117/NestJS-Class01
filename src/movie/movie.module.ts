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
import { CommonModule } from 'src/common/common.module';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { UserModule } from 'src/user/user.module';
import { User } from 'src/user/entity/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Movie,
      MovieDetail,
      Director,
      Genre,
      User,
      MovieUserLike,
    ]),
    DirectorModule,
    AuthModule,
    CommonModule,
    UserModule,
    // MulterModule.register({
    //   storage: diskStorage({
    //     destination: join(process.cwd(), 'public', 'movie'),
    //     filename: (req, file, callback) => {
    //       const split = file.originalname.split('.');
    //       let extension = 'mp4';

    //       if (split.length > 1) {
    //         extension = split[split.length - 1];
    //       }

    //       callback(null, `${v4()}_${Date.now()}.${extension}`);
    //     },
    //   }),
    // }),
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
