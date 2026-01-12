import { CreateMovieDto } from './dto/create-movie.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';

@Injectable()
export class MovieService {
  private movies: Movie[] = [];
  private idCounter = 3;

  constructor() {
    const movie1 = new Movie();

    movie1.id = 1;
    movie1.title = '해리포터';
    movie1.genre = 'fantasy';

    const movie2 = new Movie();
    movie2.id = 2;
    movie2.title = '반지의 제왕';
    movie2.genre = 'action';

    this.movies.push(movie1, movie2);
  }

  getManyMovies(title?: string) {
    if (!title) {
      return this.movies;
    }
    return this.movies.filter((m) => m.title.startsWith(title));
  }

  getMovieById(id: number) {
    const movie = this.movies.find((m) => m.id === +id);

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return movie;
  }

  createMovie(CreateMovieDto: CreateMovieDto) {
    const newMovie: Movie = {
      id: this.idCounter++,
      ...CreateMovieDto,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
    };
    this.movies.push(newMovie);
    return newMovie;
  }

  updateMovie(id: number, UpdateMovieDto: UpdateMovieDto) {
    const movie = this.movies.find((m) => m.id === +id);
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    Object.assign(movie, UpdateMovieDto);

    return movie;
  }

  deleteMovie(id: number) {
    const movieIndex = this.movies.findIndex((m) => m.id === +id);
    if (movieIndex === -1) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    this.movies.splice(movieIndex, 1);
    return id;
  }
}
