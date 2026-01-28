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
// import { Movie, MovieSchema } from './schema/movie.schema';
// import { MovieDetail, MovieDetailSchema } from './schema/movie-detail.schema';
// import { Director, DirectorSchema } from 'src/director/schema/director.schema';
// import { Genre, GenreSchema } from 'src/genre/schema/genre.schema';
// import { User, UserSchema } from 'src/user/schema/user.schema';
// import {
//   MovieUserLike,
//   MovieUserLikeSchema,
// } from './schema/movie-user-like.schema';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types, Document } from 'mongoose';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MovieUserLike)
    private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    private readonly prismaService: PrismaService,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
    // @InjectModel(Movie.name)
    // private readonly movieModel: Model<Movie>,
    // @InjectModel(MovieDetail.name)
    // private readonly movieDetailModel: Model<MovieDetail>,
    // @InjectModel(Director.name)
    // private readonly directorModel: Model<Director>,
    // @InjectModel(Genre.name)
    // private readonly genreModel: Model<Genre>,
    // @InjectModel(User.name)
    // private readonly userModel: Model<User>,
    // @InjectModel(MovieUserLike.name)
    // private readonly movieUserLikeModel: Model<MovieUserLike>,
  ) {}

  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if (cacheData) {
      return cacheData;
    }

    const data = await this.movieRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: 10,
    });
    // const data = await this.prismaService.movie.findMany({
    //   orderBy: {
    //     createdAt: 'desc',
    //   },
    //   take: 10,
    // });
    // const data = await this.movieModel
    //   .find()
    //   .sort({ createdAt: -1 })
    //   .populate({
    //     path: 'genres',
    //     model: 'Genre',
    //   })
    //   .limit(10)
    //   .exec();

    await this.cacheManager.set('MOVIE_RECENT', data);

    return data;
  }

  /* istanbul ignore next */
  async getMovies() {
    return this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');
  }

  /* istanbul ignore next */
  async getLikedMovies(movieIds: number[], userId: number) {
    return this.movieUserLikeRepository
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id IN (:...movieIds)', { movieIds })
      .andWhere('user.id = :userId', { userId })
      .getMany();
  }

  async findAll(dto: GetMoviesDto, userId?: string) {
    const { title, cursor, take, order } = dto;

    // const orderBy = order.reduce((acc, field) => {
    //   const [column, direction] = field.split('_');
    //   if (column === 'id') {
    //     acc['_id'] = direction.toLowerCase();
    //   } else {
    //     acc[column] = direction.toLowerCase();
    //   }
    //   return acc;
    // }, {});
    const orderBy = order.map((field) => {
      const [column, direction] = field.split('_');
      return { [column]: direction.toLocaleLowerCase() };
    });

    // const movies = await this.prismaService.movie.findMany({
    //   where: title ? { title: { contains: title } } : {},
    //   take: take + 1,
    //   skip: cursor ? 1 : 0,
    //   cursor: cursor ? { id: parseInt(cursor) } : undefined,
    //   orderBy,
    //   include: {
    //     genres: true,
    //     director: true,
    //   },
    // });

    // const query = this.movieModel
    //   .find(
    //     title
    //       ? {
    //           title: {
    //             $regex: title,
    //             $options: 'i',
    //           },
    //         }
    //       : {},
    //   )
    //   .sort(orderBy)
    //   .limit(take + 1);

    // if (cursor) {
    //   query.lt('_id', new Types.ObjectId(cursor));
    // }

    // const movies = await query.populate('genres director').exec();

    const qb = await this.getMovies();

    if (title) {
      qb.where('movie.title LIKE :title', { title: `%${title}%` });
    }

    // page pagination
    // if (take && page) {
    //   this.commonService.applyPagiPaginationParamsToQb(qb, dto);
    // }

    // cursor pagination
    const { nextCursor } =
      await this.commonService.applyCursorPaginationParamsToQb(qb, dto);

    const [data, count] = await qb.getManyAndCount();

    const hasNextPage = data.length > take;

    if (hasNextPage) {
      data.pop();
    }

    if (userId) {
      const movieIds = data.map((movie) => movie.id);

      const likedMovies =
        movieIds.length > 0 ? await this.getLikedMovies(movieIds, +userId) : [];
      // const likedMovies =
      //   movieIds.length < 1
      //     ? []
      //     : await this.prismaService.movieUserLike.findMany({
      //         where: {
      //           movieId: { in: movieIds },
      //           userId: userId,
      //         },
      //         include: {
      //           movie: true,
      //         },
      //       });
      // const likedMovies =
      //   movieIds.length < 1
      //     ? []
      //     : await this.movieUserLikeModel
      //         .find({
      //           movie: {
      //             $in: movieIds.map((id) => new Types.ObjectId(id.toString())),
      //           },
      //           user: new Types.ObjectId(userId.toString()),
      //         })
      //         .populate('movie')
      //         .exec();

      const likedMovieMap = likedMovies.reduce(
        (acc, next) => ({
          ...acc,
          [next.movie.id]: next.isLike,
        }),
        {},
      );
      // const likedMovieMap = likedMovies.reduce(
      //   (acc, next) => ({
      //     ...acc,
      //     [next.movie._id.toString()]: next.isLike,
      //   }),
      //   {},
      // );

      return {
        data: data.map((movie) => ({
          ...movie,
          likeStatus:
            movie.id in likedMovieMap ? likedMovieMap[movie.id] : null,
        })),
        nextCursor,
        hasNextPage,
      };
      // return {
      //   data: movies.map((movie) => ({
      //     ...movie.toObject(),
      //     likeStatus:
      //       movie._id.toString() in likedMovieMap
      //         ? likedMovieMap[movie._id.toString()]
      //         : null,
      //   })) as (Document<unknown, {}, Movie> &
      //     Movie &
      //     Required<{
      //       _id: unknown;
      //     }> & {
      //       __v?: number;
      //     } & {
      //       likeStatus: boolean;
      //     })[],
      //   nextCursor,
      //   hasNextPage,
      // };

      // data = data.map((x) => ({
      //   ...x,
      //   likeStatus: x.id in likedMovieMap ? likedMovieMap[x.id] : null,
      // }));
    }

    return { data, count, nextCursor };
    // return {
    //   data: movies,
    //   nextCursor,
    //   hasNextPage,
    // };
  }

  /* istanbul ignore next */
  async findMovieDetail(id: number) {
    return this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .leftJoinAndSelect('movie.creator', 'creator')
      .where('movie.id = :id', { id })
      .getOne();
  }

  async findOne(id: number) {
    const movie = await this.findMovieDetail(id);

    // const movie = await this.prismaService.movie.findUnique({
    //   where: { id },
    // });
    // const movie = await this.movieModel.findById(id);

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
    return qr.manager
      .createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({
        detail: CreateMovieDto.detail,
      })
      .execute();
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
    return qr.manager
      .createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: createMovieDto.title,
        detail: {
          id: movieDetailId,
        },
        director,
        creator: {
          id: userId,
        },
        movieFilePath: join(movieFolder, createMovieDto.movieFileName),
      })
      .execute();
  }

  createMovieGenreRelation(qr: QueryRunner, movieId: number, genres: Genre[]) {
    return qr.manager
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map((genre) => genre.id));
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

  //prisma and mongoose
  async create(
    createMovieDto: CreateMovieDto,
    qr: QueryRunner,
    userId: number,
  ) {
    // const session = await this.movieModel.startSession();
    // session.startTransaction();

    // try {
    //   const director = await this.directorModel
    //     .findById(createMovieDto.directorId)
    //     .exec();

    //   if (!director) {
    //     throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
    //   }

    //   // genreIds를 ObjectId로 변환 (number를 string으로 변환 후 ObjectId 생성)
    //   const genreObjectIds = createMovieDto.genreIds.map(
    //     (id) => new Types.ObjectId(String(id)),
    //   );

    //   const genres = await this.genreModel
    //     .find({ _id: { $in: genreObjectIds } })
    //     .exec();

    //   if (genres.length !== createMovieDto.genreIds.length) {
    //     throw new NotFoundException(
    //       `존재하지 않는 장르가 있습니다! 존재하는 ids -> ${genres.map((genre) => genre._id.toString()).join(',')}`,
    //     );
    //   }

    //   // userId를 ObjectId로 변환
    //   const user = await this.userModel.findById(userId).exec();
    //   if (!user) {
    //     throw new NotFoundException('존재하지 않는 사용자입니다!');
    //   }

    //   const movieDetail = await this.movieDetailModel.create(
    //     [
    //       {
    //         detail: createMovieDto.detail,
    //       },
    //     ],
    //     {
    //       session,
    //     },
    //   );

    //   const movie = await this.movieModel.create(
    //     [
    //       {
    //         title: createMovieDto.title,
    //         movieFilePath: createMovieDto.movieFileName,
    //         creator: new Types.ObjectId(userId),
    //         director: director._id,
    //         genres: genres.map((genre) => genre._id),
    //         detail: movieDetail[0]._id,
    //       },
    //     ],
    //     {
    //       session,
    //     },
    //   );

    //   await session.commitTransaction();

    //   return this.movieModel
    //     .findById(movie[0]._id)
    //     .populate('detail')
    //     .populate('director')
    //     .populate({
    //       path: 'genres',
    //       model: 'Genre',
    //     })
    //     .exec();
    // } catch (e) {
    //   await session.abortTransaction();
    //   console.log(e);
    //   throw new InternalServerErrorException('트랜잭션 실패');
    // } finally {
    //   session.endSession();
    // }

    // const qr = this.dataSource.createQueryRunner();
    // await qr.connect();
    // await qr.startTransaction();

    try {
      const director = await qr.manager.findOne(Director, {
        where: { id: createMovieDto.directorId },
      });

      if (!director) {
        throw new NotFoundException(
          `Director with ID ${createMovieDto.directorId} not found`,
        );
      }

      const genres = await qr.manager.find(Genre, {
        where: { id: In(createMovieDto.genreIds) },
      });

      if (genres.length !== createMovieDto.genreIds.length) {
        throw new NotFoundException(
          `존재하지 않는 장르가 있습니다. 존재하는 장르: ${genres.map((genre) => genre.id).join(', ')}`,
        );
      }

      const movieDetail = await this.createMovieDetail(qr, createMovieDto);

      const movieDetailId = movieDetail.identifiers[0].id;

      const movieFolder = join('public', 'movie');
      const tempFolder = join('public', 'temp');

      const movie = await this.createMovie(
        qr,
        createMovieDto,
        director,
        movieDetailId,
        userId,
        movieFolder,
      );

      const movieId = movie.identifiers[0].id;

      await this.createMovieGenreRelation(qr, movieId, genres);

      await this.renameMovieFile(tempFolder, movieFolder, createMovieDto);
      // throw new InternalServerErrorException('트랜잭션 확인용 에러'); // 트랜잭션 확인용

      return qr.manager.findOne(Movie, {
        where: { id: movieId },
        relations: ['detail', 'director', 'genres'],
      });
    } catch (e) {
      throw e;
    }

    // return this.prisma.$transaction(async (prisma) => {
    //   // const director = await prisma.director.findUnique({
    //   //   where: {
    //   //     id: createMovieDto.directorId,
    //   //   }
    //   // });

    //   // if (!director) {
    //   //   throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
    //   // }

    //   // const genres = await prisma.genre.findMany({
    //   //   where: {
    //   //     id: {
    //   //       in: createMovieDto.genreIds,
    //   //     }
    //   //   }
    //   // });

    //   // if (genres.length !== createMovieDto.genreIds.length) {
    //   //   throw new NotFoundException(`존재하지 않는 장르가 있습니다! 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`);
    //   // }

    //   // const movieDetail = await prisma.movieDetail.create({
    //   //   data: { detail: createMovieDto.detail },
    //   // });

    //   // const movie = await prisma.movie.create({
    //   //   data: {
    //   //     title: createMovieDto.title,
    //   //     movieFilePath: createMovieDto.movieFileName,
    //   //     creator: { connect: { id: userId } },
    //   //     director: { connect: { id: director.id } },
    //   //     genres: { connect: genres.map((genre) => ({ id: genre.id })) },
    //   //     detail: { connect: { id: movieDetail.id } }
    //   //   }
    //   // });

    //   return prisma.movie.findUnique({
    //     where: {
    //       id: movie.id,
    //     },
    //     include: {
    //       detail: true,
    //       director: true,
    //       genres: true,
    //     }
    //   });
    // });
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
    return qr.manager
      .createQueryBuilder()
      .update(Movie)
      .set(movieUpdateFields)
      .where('id = :id', { id })
      .execute();
  }

  /* istanbul ignore next */
  updateMovieDetail(qr: QueryRunner, detail: string, movie: Movie) {
    return qr.manager
      .createQueryBuilder()
      .update(MovieDetail)
      .set({ detail })
      .where('id = :id', { id: movie.detail.id })
      .execute();
  }

  /* istanbul ignore next */
  updateMovieGenreRelation(
    qr: QueryRunner,
    id: number,
    newGenres: Genre[],
    movie: Movie,
  ) {
    return qr.manager
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(id)
      .addAndRemove(
        newGenres.map((genre) => genre.id),
        movie.genres.map((genre) => genre.id),
      );
  }

  async update(id: number, updateMovieDto: UpdateMovieDto, qr: QueryRunner) {
    // async update(id: string, updateMovieDto: UpdateMovieDto) {
    // const session = await this.movieModel.startSession();
    // session.startTransaction();

    // try {
    //   const movie = await this.movieModel
    //     .findById(id)
    //     .populate('detail genres')
    //     .exec();

    //   if (!movie) {
    //     throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
    //   }

    //   const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

    //   const movieUpdateParams: {
    //     title?: string;
    //     movieFileName?: string;
    //     director?: Types.ObjectId;
    //     genres?: Types.ObjectId[];
    //   } = {
    //     ...movieRest,
    //   };

    //   if (directorId) {
    //     const director = await this.directorModel.findById(directorId).exec();

    //     if (!director) {
    //       throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
    //     }

    //     movieUpdateParams.director = director._id;
    //   }

    //   if (genreIds) {
    //     // genreIds를 ObjectId로 변환 (number를 string으로 변환 후 ObjectId 생성)
    //     const genreObjectIds = genreIds.map(
    //       (id) => new Types.ObjectId(String(id)),
    //     );

    //     const genres = await this.genreModel
    //       .find({
    //         _id: { $in: genreObjectIds },
    //       })
    //       .exec();

    //     if (genres.length !== genreIds.length) {
    //       throw new NotFoundException(
    //         `존재하지 않는 장르가 있습니다! 존재하는 ids -> ${genres.map((genre) => genre._id.toString()).join(',')}`,
    //       );
    //     }

    //     movieUpdateParams.genres = genres.map((genre) => genre._id);
    //   }

    //   if (detail) {
    //     await this.movieDetailModel
    //       .findByIdAndUpdate(movie.detail._id, {
    //         detail,
    //       })
    //       .exec();
    //   }

    //   await this.movieModel.findByIdAndUpdate(id, movieUpdateParams);

    //   await session.commitTransaction();

    //   return this.movieModel
    //     .findById(id)
    //     .populate('detail director')
    //     .populate({
    //       path: 'genres',
    //       model: 'Genre',
    //     })
    //     .exec();
    // } catch (e) {
    //   await session.abortTransaction();
    // } finally {
    //   session.endSession();
    // }

    try {
      const movie = await qr.manager.findOne(Movie, {
        where: { id },
        relations: ['detail', 'genres'],
      });

      if (!movie) {
        throw new NotFoundException(`Movie with ID ${id} not found`);
      }

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      let newDirector;

      if (directorId) {
        const director = await qr.manager.findOne(Director, {
          where: { id: directorId },
        });

        if (!director) {
          throw new NotFoundException(
            `Director with ID ${directorId} not found`,
          );
        }

        newDirector = director;
      }

      let newGenres;

      if (genreIds) {
        const genres = await qr.manager.find(Genre, {
          where: { id: In(genreIds) },
        });

        if (genres.length !== genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다. 존재하는 장르: ${genres.map((genre) => genre.id).join(', ')}`,
          );
        }

        newGenres = genres;
      }

      const movieUpdateFields = {
        ...movieRest,
        ...(newDirector && { director: newDirector }),
      };

      await this.updateMovie(qr, movieUpdateFields, id);

      // await this.movieRepository.update({ id }, movieUpdateFields);

      // throw new NotFoundException('test'); // 트랜잭션 확인용

      if (detail) {
        await this.updateMovieDetail(qr, detail, movie);

        // await this.movieDetailRepository.update(
        //   { id: movie.detail.id },
        //   { detail },
        // );
      }

      if (newGenres) {
        await this.updateMovieGenreRelation(qr, id, newGenres, movie);
      }

      const newMovie = await this.movieRepository.findOne({
        where: { id },
        relations: ['detail', 'director', 'genres'],
      });

      newMovie!.genres = newGenres;

      await this.movieRepository.save(newMovie!);

      return this.movieRepository.findOne({
        where: { id },
        relations: ['detail', 'director', 'genres'],
      });
    } catch (e) {
      throw e;
    }

    // return this.prismaService.$transaction(async (prisma) => {
    //   const movie = await prisma.movie.findUnique({
    //     where: { id },
    //     include: {
    //       detail: true,
    //       genres: true,
    //     },
    //   });

    //   if (!movie) {
    //     throw new NotFoundException(`Movie with ID ${id} not found`);
    //   }

    //   const { detail, directorId, genreIds, ...movieRest } = UpdateMovieDto;

    //   const movieUpdateParams: Prisma.MovieUpdateInput = {
    //     ...movieRest,
    //   };

    //   if (directorId) {
    //     const director = await prisma.director.findUnique({
    //       where: { id: directorId },
    //     });

    //     if (!director) {
    //       throw new NotFoundException(
    //         `Director with ID ${directorId} not found`,
    //       );
    //     }

    //     movieUpdateParams.director = { connect: { id: directorId } };
    //   }

    //   if (genreIds) {
    //     const genres = await prisma.genre.findMany({
    //       where: { id: { in: genreIds } },
    //     });

    //     if (genres.length !== genreIds.length) {
    //       throw new NotFoundException(
    //         `존재하지 않는 장르가 있습니다. 존재하는 장르: ${genres.map((genre) => genre.id).join(', ')}`,
    //       );
    //     }

    //     movieUpdateParams.genres = {
    //       set: genres.map((genre) => ({ id: genre.id })),
    //     };
    //   }

    //   await prisma.movie.update({
    //     where: { id },
    //     data: movieUpdateParams,
    //   });

    //   if (detail) {
    //     await prisma.movieDetail.update({
    //       where: { id: movie.detail.id },
    //       data: { detail },
    //     });
    //   }

    //   return prisma.movie.findUnique({
    //     where: { id },
    //     include: {
    //       detail: true,
    //       genres: true,
    //       director: true,
    //     },
    //   });
    // });
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
    return this.movieRepository
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .execute();
  }

  async remove(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });
    // const movie = await this.prismaService.movie.findUnique({
    //   where: { id },
    //   include: {
    //     detail: true,
    //   },
    // });
    // const movie = await this.movieModel.findById(id).populate('detail').exec();

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    await this.deleteMovie(id);
    // await this.prismaService.movie.delete({ where: { id } });
    // await this.movieRepository.delete(id);
    // await this.movieModel.findByIdAndDelete(id).exec();

    await this.movieDetailRepository.delete({ id: movie.detail.id });
    // await this.prismaService.movieDetail.delete({
    //   where: { id: movie.detail.id },
    // });
    // await this.movieDetailModel.findByIdAndDelete(movie.detail._id).exec();

    return id;
  }

  /* istanbul ignore next */
  getLikedRecord(movieId: number, userId: number) {
    return this.movieUserLikeRepository
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id = :movieId', { movieId })
      .andWhere('user.id = :userId', { userId })
      .getOne();
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['likedUsers'],
    });
    // const movie = await this.prismaService.movie.findUnique({
    //   where: { id: movieId },
    //   include: {
    //     likedUsers: true,
    //   },
    // });
    // const movie = await this.movieModel.findById(movieId).exec();

    if (!movie) {
      throw new BadRequestException(`존재하지 않는 영화입니다.`);
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    // const user = await this.prismaService.user.findUnique({
    //   where: { id: userId },
    // });
    // const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new UnauthorizedException(`존재하지 않는 사용자입니다.`);
    }

    const likeRecord = await this.getLikedRecord(movieId, userId);
    // const likeRecord = await this.prismaService.movieUserLike.findUnique({
    //   where: {
    //     movieId_userId: {
    //       movieId,
    //       userId,
    //     },
    //   },
    // });
    // const likeRecord = await this.movieUserLikeModel.findOne({
    //   movie: new Types.ObjectId(movieId),
    //   user: new Types.ObjectId(userId),
    // });

    if (likeRecord) {
      if (isLike === likeRecord.isLike) {
        await this.movieUserLikeRepository.delete({
          movie,
          user,
        });
        // await this.prismaService.movieUserLike.delete({
        //   where: {
        //     movieId_userId: {
        //       movieId,
        //       userId,
        //     },
        //   },
        // });
        // await this.movieUserLikeModel.findByIdAndDelete(likeRecord._id).exec();
      } else {
        await this.movieUserLikeRepository.update(
          {
            movie,
            user,
          },
          {
            isLike,
          },
        );
        // await this.prismaService.movieUserLike.update({
        //   where: {
        //     movieId_userId: {
        //       movieId,
        //       userId,
        //     },
        //   },
        //   data: { isLike },
        // });
        // await this.movieUserLikeModel
        //   .findByIdAndUpdate(likeRecord._id, { isLike })
        //   .exec();
        // likeRecord.isLike = isLike;
        // await likeRecord.save();
      }
    } else {
      await this.movieUserLikeRepository.save({
        movie,
        user,
        isLike,
      });
      // await this.prismaService.movieUserLike.create({
      //   data: {
      //     movie: { connect: { id: movieId } },
      //     user: { connect: { id: userId } },
      //     isLike,
      //   },
      // });

      // await this.movieUserLikeModel.create({
      //   movie: new Types.ObjectId(movieId),
      //   user: new Types.ObjectId(userId),
      //   isLike,
      // });
    }

    const result = await this.getLikedRecord(movieId, userId);
    // const result = await this.prismaService.movieUserLike.findUnique({
    //   where: {
    //     movieId_userId: {
    //       movieId,
    //       userId,
    //     },
    //   },
    // });
    // const result = await this.movieUserLikeModel.findOne({
    //   movie: new Types.ObjectId(movieId),
    //   user: new Types.ObjectId(userId),
    // });

    return {
      isLike: result && result.isLike,
    };
  }
}
