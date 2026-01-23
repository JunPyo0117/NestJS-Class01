import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Genre } from './entity/genre.entity';
import { Repository } from 'typeorm';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class GenreService {
  constructor(
    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,
    private readonly prismaService: PrismaService,
  ) {}

  async create(createGenreDto: CreateGenreDto) {
    // const genre = await this.genreRepository.findOne({
    //   where: { name: createGenreDto.name },
    // });
    const genre = await this.prismaService.genre.findUnique({
      where: { name: createGenreDto.name },
    });

    if (genre) {
      throw new NotFoundException(`이미 존재하는 장르입니다`);
    }

    // return this.genreRepository.save(createGenreDto);
    return this.prismaService.genre.create({ data: createGenreDto });
  }

  findAll() {
    // return this.genreRepository.find();
    return this.prismaService.genre.findMany();
  }

  async findOne(id: number) {
    // const genre = await this.genreRepository.findOne({ where: { id } });
    const genre = await this.prismaService.genre.findUnique({ where: { id } });

    if (!genre) {
      throw new NotFoundException(`Genre with ID ${id} not found`);
    }

    return genre;
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    // const genre = await this.genreRepository.findOne({ where: { id } });
    const genre = await this.prismaService.genre.findUnique({ where: { id } });

    if (!genre) {
      throw new NotFoundException(`Genre with ID ${id} not found`);
    }

    // await this.genreRepository.update({ id }, { ...updateGenreDto });
    await this.prismaService.genre.update({
      where: { id },
      data: updateGenreDto,
    });

    // const newGenre = await this.genreRepository.findOne({ where: { id } });
    const newGenre = await this.prismaService.genre.findUnique({
      where: { id },
    });

    return newGenre;
  }

  async remove(id: number) {
    // const genre = await this.genreRepository.findOne({ where: { id } });
    const genre = await this.prismaService.genre.findUnique({ where: { id } });

    if (!genre) {
      throw new NotFoundException(`Genre with ID ${id} not found`);
    }

    // await this.genreRepository.delete(id);
    await this.prismaService.genre.delete({ where: { id } });

    return id;
  }
}
