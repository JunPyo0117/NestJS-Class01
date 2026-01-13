import { CreateMovieDto } from './dto/create-movie.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { In, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';

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
  ) {}

  async findAll(title?: string) {
    const qb = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');
    if (title) {
      qb.where('movie.title LIKE :title', { title: `%${title}%` });
    }

    return await qb.getManyAndCount();

    // 나중에 title 필터 기능 추가
    // if (!title) {
    //   return [
    //     await this.movieRepository.find({ relations: ['director', 'genres'] }),
    //     await this.movieRepository.count(),
    //   ];
    // }

    // if (title) {
    //   return await this.movieRepository.findAndCount({
    //     where: { title: Like(`%${title}%`) },
    //     relations: ['director', 'genres'],
    //   });
    // }
  }

  async findOne(id: number) {
    const movie = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .where('movie.id = :id', { id })
      .getOne();

    // const movie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail', 'director', 'genres'],
    // });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return movie;
  }

  async create(CreateMovieDto: CreateMovieDto) {
    const director = await this.directorRepository.findOne({
      where: { id: CreateMovieDto.directorId },
    });

    if (!director) {
      throw new NotFoundException(
        `Director with ID ${CreateMovieDto.directorId} not found`,
      );
    }

    const genres = await this.genreRepository.find({
      where: { id: In(CreateMovieDto.genreIds) },
    });

    if (genres.length !== CreateMovieDto.genreIds.length) {
      throw new NotFoundException(
        `존재하지 않는 장르가 있습니다. 존재하는 장르: ${genres.map((genre) => genre.id).join(', ')}`,
      );
    }

    const movieDetail = await this.movieDetailRepository
      .createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({
        detail: CreateMovieDto.detail,
      })
      .execute();

    const movieDetailId = movieDetail.identifiers[0].id;

    const movie = await this.movieRepository
      .createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: CreateMovieDto.title,
        detail: {
          id: movieDetailId,
        },
        director: director,
      })
      .execute();

    const movieId = movie.identifiers[0].id;

    await this.movieRepository
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map((genre) => genre.id));

    // const movie = await this.movieRepository.save({
    //   title: CreateMovieDto.title,
    //   genre: CreateMovieDto.genreIds,
    //   detail: {
    //     detail: CreateMovieDto.detail,
    //   },
    //   director: director,
    //   genres: genres,
    // });

    // return movie;

    return this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['detail', 'director', 'genres'],
    });
  }

  async update(id: number, UpdateMovieDto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail', 'genres'],
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    const { detail, directorId, genreIds, ...movieRest } = UpdateMovieDto;

    let newDirector;

    if (directorId) {
      const director = await this.directorRepository.findOne({
        where: { id: directorId },
      });

      if (!director) {
        throw new NotFoundException(`Director with ID ${directorId} not found`);
      }

      newDirector = director;
    }

    let newGenres;

    if (genreIds) {
      const genres = await this.genreRepository.find({
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

    await this.movieRepository
      .createQueryBuilder()
      .update(Movie)
      .set(movieUpdateFields)
      .where('id = :id', { id })
      .execute();

    // await this.movieRepository.update({ id }, movieUpdateFields);

    if (detail) {
      await this.movieDetailRepository
        .createQueryBuilder()
        .update(MovieDetail)
        .set({ detail })
        .where('id = :id', { id: movie.detail.id })
        .execute();

      // await this.movieDetailRepository.update(
      //   { id: movie.detail.id },
      //   { detail },
      // );
    }

    if (newGenres) {
      await this.movieRepository
        .createQueryBuilder()
        .relation(Movie, 'genres')
        .of(id)
        .addAndRemove(
          newGenres.map((genre) => genre.id),
          movie.genres.map((genre) => genre.id),
        );
    }

    // const newMovie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail', 'director', 'genres'],
    // });

    // newMovie!.genres = newGenres;

    // await this.movieRepository.save(newMovie!);

    return this.movieRepository.findOne({
      where: { id },
      relations: ['detail', 'director', 'genres'],
    });
  }

  async remove(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail', 'genres'],
    });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    await this.movieRepository
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .execute();
    // await this.movieRepository.delete(id);
    await this.movieDetailRepository.delete({ id: movie.detail.id });

    return id;
  }
}
