import { Test, TestingModule } from '@nestjs/testing';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { TestBed } from '@automock/jest';
import { Movie } from './entity/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { QueryRunner } from 'typeorm';
import { UpdateMovieDto } from './dto/update-movie.dto';

describe('MovieController', () => {
  let movieController: MovieController;
  let movieService: jest.Mocked<MovieService>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(MovieController).compile();

    movieController = unit;
    movieService = unitRef.get<MovieService>(MovieService);
  });

  it('should be defined', () => {
    expect(movieController).toBeDefined();
  });

  describe('getMovies', () => {
    it('should call movieService.findAll with the correct parameters', async () => {
      const dto = { page: 1, limit: 10 };
      const userId = 1;
      const movies = [{ id: 1 }, { id: 2 }];

      jest.spyOn(movieService, 'findAll').mockResolvedValue(movies as any);

      const result = await movieController.getMovies(dto as any, userId);

      expect(movieService.findAll).toHaveBeenCalledWith(dto, userId);
      expect(result).toEqual(movies);
    });
  });

  describe('recent', () => {
    it('should call movieService.findRecent', async () => {
      const dto = { page: 1, limit: 10 };
      const userId = 1;
      const movies = [{ id: 1 }, { id: 2 }];

      await movieController.getMoviesRecent();

      expect(movieService.findRecent).toHaveBeenCalled();
    });
  });

  describe('getMovie', () => {
    it('should call movieService.findOne with id and optional userId', async () => {
      const id = 1;
      const request = { session: null };
      await movieController.getMovie(id, request, undefined);

      expect(movieService.findOne).toHaveBeenCalledWith(1, undefined);
    });
  });

  describe('createMovie', () => {
    it('should call movieService.create with the correct parameters', async () => {
      const body = { title: 'Test Movie' };
      const userId = 1;
      const queryRunner = {};

      await movieController.createMovie(
        body as CreateMovieDto,
        queryRunner as QueryRunner,
        userId,
      );

      expect(movieService.create).toHaveBeenCalledWith(
        body,
        queryRunner,
        userId,
      );
    });
  });

  describe('updateMovie', () => {
    it('should call movieService.update with the correct parameters', async () => {
      const id = 1;
      const body: UpdateMovieDto = { title: 'Updated Movie' };
      const queryRunner = {} as QueryRunner;

      await movieController.updateMovie(id, body, queryRunner);

      expect(movieService.update).toHaveBeenCalledWith(1, body, queryRunner);
    });
  });

  describe('deleteMovie', () => {
    it('should call movieService.remove with the correct id', async () => {
      const id = 1;
      await movieController.deleteMovie(id);
      expect(movieService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('createMovieLike', () => {
    it('should call movieService.toggleMovieLike with the correct parameters', async () => {
      const movieId = 1;
      const userId = 2;

      await movieController.createMovieLike(movieId, userId);
      expect(movieService.toggleMovieLike).toHaveBeenCalledWith(
        movieId,
        userId,
        true,
      );
    });
  });

  describe('createMovieDislike', () => {
    it('should call movieService.toggleMovieDislike with the correct parameters', async () => {
      const movieId = 1;
      const userId = 2;

      await movieController.createMovieDislike(movieId, userId);
      expect(movieService.toggleMovieLike).toHaveBeenCalledWith(
        movieId,
        userId,
        false,
      );
    });
  });
});
