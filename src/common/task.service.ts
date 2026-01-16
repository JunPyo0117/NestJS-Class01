import { Injectable } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  logEverySecond() {
    console.log('1초 마다 실행 ');
  }

  // @Cron('* * * * * *')
  async eraseOrphanFiles() {
    const files = await readdir(join(process.cwd(), 'public', 'temp'));

    const deleteFilesTarget = files.filter((file) => {
      const filename = parse(file).name;

      const split = filename.split('_');

      if (split.length !== 2) {
        return true;
      }

      try {
        const date = +new Date(parseInt(split[split.length - 1]));
        const aDayInMilSec = 24 * 60 * 60 * 1000;
        const now = +new Date();

        return now - date > aDayInMilSec;
      } catch {
        return true;
      }
    });

    await Promise.all(
      deleteFilesTarget.map((x) =>
        unlink(join(process.cwd(), 'public', 'temp', x)),
      ),
    );
  }

  // @Cron('0 * * * * *')
  async calculateMovieLikeCount() {
    console.log('calculateMovieLikeCount');
    await this.movieRepository.query(
      `UPDATE movie m
      SET "likeCount" = COALESCE((
        SELECT COUNT(*) 
        FROM movie_user_like mul 
        WHERE m.id = mul."movieId" AND mul."isLike" = true
      ), 0)`,
    );
  }

  async calculateMovieDislikeCount() {
    await this.movieRepository.query(
      `UPDATE movie m
      SET "dislikeCount" = COALESCE((
        SELECT COUNT(*) 
        FROM movie_user_like mul 
        WHERE m.id = mul."movieId" AND mul."isLike" = false
      ), 0)`,
    );
  }

  // @Cron('* * * * * *', {
  //   name: 'printer',
  // })
  printer() {
    console.log('printer every second');
  }

  // @Cron('*/5 * * * * *')
  stopper() {
    console.log('---stopper run---');

    const job = this.schedulerRegistry.getCronJob('printer');

    // console.log('#last date');
    // console.log(job.lastDate());
    // console.log('#next date');
    // console.log(job.nextDate());
    console.log('# Next Dates');
    console.log(job.nextDates(5));

    // 런타임에는 running 속성이 존재하지만 타입 정의에는 없음
    if ((job as any).running) {
      void job.stop();
    } else {
      void job.start();
    }
  }
}
