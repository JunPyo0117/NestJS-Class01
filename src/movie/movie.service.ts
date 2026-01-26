import { CreateMovieDto } from './dto/create-movie.dto';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { DataSource } from 'typeorm';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { QueryRunner } from 'typeorm';
import { Prisma } from '@prisma/client';
import { join } from 'path';
import { rename } from 'fs/promises';
import { User } from 'src/user/entity/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from 'src/common/const/env.const';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class MovieService {
  constructor(
    // @InjectRepository(Movie)
    // private readonly movieRepository: Repository<Movie>,
    // @InjectRepository(MovieDetail)
    // private readonly movieDetailRepository: Repository<MovieDetail>,
    // @InjectRepository(Director)
    // private readonly directorRepository: Repository<Director>,
    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
    // @InjectRepository(MovieUserLike)
    // private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    private readonly prismaService: PrismaService,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if (cacheData) {
      return cacheData;
    }

    // const data = await this.movieRepository.find({
    //   order: {
    //     createdAt: 'DESC',
    //   },
    //   take: 10,
    // });
    const data = await this.prismaService.movie.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    await this.cacheManager.set('MOVIE_RECENT', data);

    return data;
  }

  /* istanbul ignore next */
  async getMovies() {
    // return this.movieRepository
    //   .createQueryBuilder('movie')
    //   .leftJoinAndSelect('movie.director', 'director')
    //   .leftJoinAndSelect('movie.genres', 'genres');
  }

  /* istanbul ignore next */
  async getLikedMovies(movieIds: number[], userId: number) {
    // return this.movieUserLikeRepository
    //   .createQueryBuilder('mul')
    //   .leftJoinAndSelect('mul.movie', 'movie')
    //   .leftJoinAndSelect('mul.user', 'user')
    //   .where('movie.id IN (:...movieIds)', { movieIds })
    //   .andWhere('user.id = :userId', { userId })
    //   .getMany();
  }

  async findAll(dto: GetMoviesDto, userId?: number) {
    // const { title } = dto;
    const { title, cursor, take, order } = dto;

    const orderBy = order.map((field) => {
      const [column, direction] = field.split('_');
      return { [column]: direction.toLocaleLowerCase() };
    });

    const movies = await this.prismaService.movie.findMany({
      where: title ? { title: { contains: title } } : {},
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: parseInt(cursor) } : undefined,
      orderBy,
      include: {
        genres: true,
        director: true,
      },
    });

    const hasNextPage = movies.length > take;

    if (hasNextPage) {
      movies.pop();
    }

    const nextCursor = hasNextPage
      ? movies[movies.length - 1].id.toString()
      : null;

    const data = movies.slice(0, take);
    const count = await this.prismaService.movie.count({
      where: title ? { title: { contains: title } } : {},
    });

    // const qb = await this.getMovies();

    // if (title) {
    //   qb.where('movie.title LIKE :title', { title: `%${title}%` });
    // }

    // page pagination
    // if (take && page) {
    //   this.commonService.applyPagiPaginationParamsToQb(qb, dto);
    // }

    // cursor pagination
    // const { nextCursor } =
    //   await this.commonService.applyCursorPaginationParamsToQb(qb, dto);

    // let [data, count] = await qb.getManyAndCount();

    if (userId) {
      // const movieIds = data.map((movie) => movie.id);
      const movieIds = movies.map((movie) => movie.id);

      // const likedMovies =
      //   movieIds.length > 0 ? await this.getLikedMovies(movieIds, userId) : [];
      const likedMovies =
        movieIds.length < 1
          ? []
          : await this.prismaService.movieUserLike.findMany({
              where: {
                movieId: { in: movieIds },
                userId: userId,
              },
              include: {
                movie: true,
              },
            });

      const likedMovieMap = likedMovies.reduce(
        (acc, next) => ({
          ...acc,
          [next.movie.id]: next.isLike,
        }),
        {},
      );

      return {
        data: movies.map((movie) => ({
          ...movie,
          likeStatus:
            movie.id in likedMovieMap ? likedMovieMap[movie.id] : null,
        })),
        nextCursor,
        hasNextPage,
      };

      // data = data.map((x) => ({
      //   ...x,
      //   likeStatus: x.id in likedMovieMap ? likedMovieMap[x.id] : null,
      // }));
    }

    // return { data, count, nextCursor };
    return {
      data: movies,
      nextCursor,
      hasNextPage,
    };
  }

  /* istanbul ignore next */
  async findMovieDetail(id: number) {
    // return this.movieRepository
    //   .createQueryBuilder('movie')
    //   .leftJoinAndSelect('movie.director', 'director')
    //   .leftJoinAndSelect('movie.genres', 'genres')
    //   .leftJoinAndSelect('movie.detail', 'detail')
    //   .leftJoinAndSelect('movie.creator', 'creator')
    //   .where('movie.id = :id', { id })
    //   .getOne();
  }

  async findOne(id: number) {
    // const movie = await this.findMovieDetail(id);

    const movie = await this.prismaService.movie.findUnique({
      where: { id },
    });

    // const movie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail', 'director', 'genres'],
    // });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return movie;
  }

  /* istanbul ignore next */
  async createMovieDetail(qr: QueryRunner, CreateMovieDto: CreateMovieDto) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .insert()
    //   .into(MovieDetail)
    //   .values({
    //     detail: CreateMovieDto.detail,
    //   })
    //   .execute();
  }

  /* istanbul ignore next */
  createMovie(
    qr: QueryRunner,
    createMovieDto: CreateMovieDto,
    director: Director,
    movieDetailId: number,
    userId: number,
    movieFolder: string,
  ) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .insert()
    //   .into(Movie)
    //   .values({
    //     title: createMovieDto.title,
    //     detail: {
    //       id: movieDetailId,
    //     },
    //     director,
    //     creator: {
    //       id: userId,
    //     },
    //     movieFilePath: join(movieFolder, createMovieDto.movieFileName),
    //   })
    //   .execute();
  }

  createMovieGenreRelation(qr: QueryRunner, movieId: number, genres: Genre[]) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .relation(Movie, 'genres')
    //   .of(movieId)
    //   .add(genres.map((genre) => genre.id));
  }

  renameMovieFile(
    tempFolder: string,
    movieFolder: string,
    createMovieDto: CreateMovieDto,
  ) {
    if (this.configService.get<string>(envVariableKeys.env) !== 'prod') {
      return rename(
        join(process.cwd(), tempFolder, createMovieDto.movieFileName),
        join(process.cwd(), movieFolder, createMovieDto.movieFileName),
      );
    } else {
      return this.commonService.saveMovieToPermanentStorage(
        createMovieDto.movieFileName,
      );
    }
  }

  //prisma
  async create(CreateMovieDto: CreateMovieDto, userId: number) {
    return this.prismaService.$transaction(async (prisma) => {
      const director = await prisma.director.findUnique({
        where: { id: CreateMovieDto.directorId },
      });

      if (!director) {
        throw new NotFoundException(
          `Director with ID ${CreateMovieDto.directorId} not found`,
        );
      }

      const genres = await prisma.genre.findMany({
        where: {
          id: {
            in: CreateMovieDto.genreIds,
          },
        },
      });

      if (genres.length !== CreateMovieDto.genreIds.length) {
        throw new NotFoundException(
          `존재하지 않는 장르가 있습니다. 존재하는 장르: ${genres.map((genre) => genre.id).join(', ')}`,
        );
      }

      const movieDetail = await prisma.movieDetail.create({
        data: {
          detail: CreateMovieDto.detail,
        },
      });

      const movie = await prisma.movie.create({
        data: {
          title: CreateMovieDto.title,
          movieFilePath: CreateMovieDto.movieFileName,
          creator: { connect: { id: userId } },
          director: { connect: { id: director.id } },
          genres: { connect: genres.map((genre) => ({ id: genre.id })) },
          detail: { connect: { id: movieDetail.id } },
        },
      });

      return prisma.movie.findUnique({
        where: { id: movie.id },
        include: {
          detail: true,
          director: true,
          genres: true,
        },
      });
    });
  }

  // async create(
  //   CreateMovieDto: CreateMovieDto,
  //   qr: QueryRunner,
  //   userId: number,
  // ) {
  // const qr = this.dataSource.createQueryRunner();
  // await qr.connect();
  // await qr.startTransaction();

  // try {
  // const director = await qr.manager.findOne(Director, {
  //   where: { id: CreateMovieDto.directorId },
  // });

  // if (!director) {
  //   throw new NotFoundException(
  //     `Director with ID ${CreateMovieDto.directorId} not found`,
  //   );
  // }

  // const genres = await qr.manager.find(Genre, {
  //   where: { id: In(CreateMovieDto.genreIds) },
  // });

  // if (genres.length !== CreateMovieDto.genreIds.length) {
  //   throw new NotFoundException(
  //     `존재하지 않는 장르가 있습니다. 존재하는 장르: ${genres.map((genre) => genre.id).join(', ')}`,
  //   );
  // }

  // const movieDetail = await this.createMovieDetail(qr, CreateMovieDto);

  // const movieDetailId = movieDetail.identifiers[0].id;

  // const movieFolder = join('public', 'movie');
  // const tempFolder = join('public', 'temp');

  // const movie = await this.createMovie(
  //   qr,
  //   CreateMovieDto,
  //   director,
  //   movieDetailId,
  //   userId,
  //   movieFolder,
  // );

  // const movieId = movie.identifiers[0].id;

  // await this.createMovieGenreRelation(qr, movieId, genres);

  // await this.renameMovieFile(tempFolder, movieFolder, CreateMovieDto);
  // throw new InternalServerErrorException('트랜잭션 확인용 에러'); // 트랜잭션 확인용

  // return qr.manager.findOne(Movie, {
  //   where: { id: movieId },
  //   relations: ['detail', 'director', 'genres'],
  // });
  // }

  /* istanbul ignore next */
  updateMovie(qr: QueryRunner, movieUpdateFields: Partial<Movie>, id: number) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .update(Movie)
    //   .set(movieUpdateFields)
    //   .where('id = :id', { id })
    //   .execute();
  }

  /* istanbul ignore next */
  updateMovieDetail(qr: QueryRunner, detail: string, movie: Movie) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .update(MovieDetail)
    //   .set({ detail })
    //   .where('id = :id', { id: movie.detail.id })
    //   .execute();
  }

  /* istanbul ignore next */
  updateMovieGenreRelation(
    qr: QueryRunner,
    id: number,
    newGenres: Genre[],
    movie: Movie,
  ) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .relation(Movie, 'genres')
    //   .of(id)
    //   .addAndRemove(
    //     newGenres.map((genre) => genre.id),
    //     movie.genres.map((genre) => genre.id),
    //   );
  }

  async update(id: number, UpdateMovieDto: UpdateMovieDto) {
    return this.prismaService.$transaction(async (prisma) => {
      const movie = await prisma.movie.findUnique({
        where: { id },
        include: {
          detail: true,
          genres: true,
        },
      });

      if (!movie) {
        throw new NotFoundException(`Movie with ID ${id} not found`);
      }

      const { detail, directorId, genreIds, ...movieRest } = UpdateMovieDto;

      const movieUpdateParams: Prisma.MovieUpdateInput = {
        ...movieRest,
      };

      if (directorId) {
        const director = await prisma.director.findUnique({
          where: { id: directorId },
        });

        if (!director) {
          throw new NotFoundException(
            `Director with ID ${directorId} not found`,
          );
        }

        movieUpdateParams.director = { connect: { id: directorId } };
      }

      if (genreIds) {
        const genres = await prisma.genre.findMany({
          where: { id: { in: genreIds } },
        });

        if (genres.length !== genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다. 존재하는 장르: ${genres.map((genre) => genre.id).join(', ')}`,
          );
        }

        movieUpdateParams.genres = {
          set: genres.map((genre) => ({ id: genre.id })),
        };
      }

      await prisma.movie.update({
        where: { id },
        data: movieUpdateParams,
      });

      if (detail) {
        await prisma.movieDetail.update({
          where: { id: movie.detail.id },
          data: { detail },
        });
      }

      return prisma.movie.findUnique({
        where: { id },
        include: {
          detail: true,
          genres: true,
          director: true,
        },
      });
    });
  }

  // async update(id: number, UpdateMovieDto: UpdateMovieDto) {
  //   const qr = this.dataSource.createQueryRunner();
  //   await qr.connect();
  //   await qr.startTransaction();

  //   try {
  // const movie = await qr.manager.findOne(Movie, {
  //   where: { id },
  //   relations: ['detail', 'genres'],
  // });

  // if (!movie) {
  //   throw new NotFoundException(`Movie with ID ${id} not found`);
  // }

  // const { detail, directorId, genreIds, ...movieRest } = UpdateMovieDto;

  // let newDirector;

  // if (directorId) {
  //   const director = await qr.manager.findOne(Director, {
  //     where: { id: directorId },
  //   });

  //   if (!director) {
  //     throw new NotFoundException(
  //       `Director with ID ${directorId} not found`,
  //     );
  //   }

  //   newDirector = director;
  // }

  // let newGenres;

  // if (genreIds) {
  //   const genres = await qr.manager.find(Genre, {
  //     where: { id: In(genreIds) },
  //   });

  //   if (genres.length !== genreIds.length) {
  //     throw new NotFoundException(
  //       `존재하지 않는 장르가 있습니다. 존재하는 장르: ${genres.map((genre) => genre.id).join(', ')}`,
  //     );
  //   }

  //   newGenres = genres;
  // }

  // const movieUpdateFields = {
  //   ...movieRest,
  //   ...(newDirector && { director: newDirector }),
  // };

  // await this.updateMovie(qr, movieUpdateFields, id);

  // // await this.movieRepository.update({ id }, movieUpdateFields);

  // // throw new NotFoundException('test'); // 트랜잭션 확인용

  // if (detail) {
  //   await this.updateMovieDetail(qr, detail, movie);

  //   // await this.movieDetailRepository.update(
  //   //   { id: movie.detail.id },
  //   //   { detail },
  //   // );
  // }

  // if (newGenres) {
  //   await this.updateMovieGenreRelation(qr, id, newGenres, movie);
  // }

  // const newMovie = await this.movieRepository.findOne({
  //   where: { id },
  //   relations: ['detail', 'director', 'genres'],
  // });

  // newMovie!.genres = newGenres;

  // await this.movieRepository.save(newMovie!);

  //   await qr.commitTransaction();

  //   return this.movieRepository.findOne({
  //     where: { id },
  //     relations: ['detail', 'director', 'genres'],
  //   });
  // } catch (e) {
  //   await qr.rollbackTransaction();
  //   throw e;
  // } finally {
  //   await qr.release();
  // }
  // }

  /* istanbul ignore next */
  deleteMovie(id: number) {
    // return this.movieRepository
    //   .createQueryBuilder()
    //   .delete()
    //   .where('id = :id', { id })
    //   .execute();
  }

  async remove(id: number) {
    // const movie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail'],
    // });
    const movie = await this.prismaService.movie.findUnique({
      where: { id },
      include: {
        detail: true,
      },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    // await this.deleteMovie(id);
    await this.prismaService.movie.delete({ where: { id } });
    // await this.movieRepository.delete(id);

    // await this.movieDetailRepository.delete({ id: movie.detail.id });
    await this.prismaService.movieDetail.delete({
      where: { id: movie.detail.id },
    });

    return id;
  }

  /* istanbul ignore next */
  getLikedRecord(movieId: number, userId: number) {
    // return this.movieUserLikeRepository
    //   .createQueryBuilder('mul')
    //   .leftJoinAndSelect('mul.movie', 'movie')
    //   .leftJoinAndSelect('mul.user', 'user')
    //   .where('movie.id = :movieId', { movieId })
    //   .andWhere('user.id = :userId', { userId })
    //   .getOne();
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    // const movie = await this.movieRepository.findOne({
    //   where: { id: movieId },
    //   relations: ['likedUsers'],
    // });
    const movie = await this.prismaService.movie.findUnique({
      where: { id: movieId },
      include: {
        likedUsers: true,
      },
    });

    if (!movie) {
      throw new BadRequestException(`존재하지 않는 영화입니다.`);
    }

    // const user = await this.userRepository.findOne({
    //   where: { id: userId },
    // });
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException(`존재하지 않는 사용자입니다.`);
    }

    // const likeRecord = await this.getLikedRecord(movieId, userId);
    const likeRecord = await this.prismaService.movieUserLike.findUnique({
      where: {
        movieId_userId: {
          movieId,
          userId,
        },
      },
    });

    if (likeRecord) {
      if (isLike === likeRecord.isLike) {
        // await this.movieUserLikeRepository.delete({
        //   movie,
        //   user,
        // });
        await this.prismaService.movieUserLike.delete({
          where: {
            movieId_userId: {
              movieId,
              userId,
            },
          },
        });
      } else {
        // await this.movieUserLikeRepository.update(
        //   {
        //     movie,
        //     user,
        //   },
        //   {
        //     isLike,
        //   },
        // );
        await this.prismaService.movieUserLike.update({
          where: {
            movieId_userId: {
              movieId,
              userId,
            },
          },
          data: { isLike },
        });
      }
    } else {
      // await this.movieUserLikeRepository.save({
      //   movie,
      //   user,
      //   isLike,
      // });
      await this.prismaService.movieUserLike.create({
        data: {
          movie: { connect: { id: movieId } },
          user: { connect: { id: userId } },
          isLike,
        },
      });
    }

    // const result = await this.getLikedRecord(movieId, userId);
    const result = await this.prismaService.movieUserLike.findUnique({
      where: {
        movieId_userId: {
          movieId,
          userId,
        },
      },
    });

    return {
      isLike: result && result.isLike,
    };
  }
}
