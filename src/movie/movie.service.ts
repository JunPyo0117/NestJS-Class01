import { CreateMovieDto } from './dto/create-movie.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
  ) {}

  async findAll(title?: string) {
    // 나중에 title 필터 기능 추가
    if (!title) {
      return [
        await this.movieRepository.find({ relations: ['director'] }),
        await this.movieRepository.count(),
      ];
    }

    if (title) {
      return await this.movieRepository.findAndCount({
        where: { title: Like(`%${title}%`) },
        relations: ['director'],
      });
    }
  }

  async findOne(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail', 'director'],
    });

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

    const movie = await this.movieRepository.save({
      title: CreateMovieDto.title,
      genre: CreateMovieDto.genre,
      detail: {
        detail: CreateMovieDto.detail,
      },
      director: director,
    });

    return movie;
  }

  async update(id: number, UpdateMovieDto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    const { detail, directorId, ...movieRest } = UpdateMovieDto;

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

    const movieUpdateFields = {
      ...movieRest,
      ...(newDirector && { director: newDirector }),
    };

    await this.movieRepository.update({ id }, movieUpdateFields);

    if (detail) {
      await this.movieDetailRepository.update(
        { id: movie.detail.id },
        { detail },
      );
    }

    const newMovie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail', 'director'],
    });

    return newMovie;
  }

  async remove(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    await this.movieRepository.delete(id);
    await this.movieDetailRepository.delete({ id: movie.detail.id });

    return id;
  }
}
