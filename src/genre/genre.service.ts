import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
// import { Genre } from './entity/genre.entity';
import { Repository } from 'typeorm';
import { PrismaService } from 'src/common/prisma.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Genre } from './schema/genre.schema';

@Injectable()
export class GenreService {
  constructor(
    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,
    private readonly prismaService: PrismaService,
    @InjectModel(Genre.name)
    private readonly genreModel: Model<Genre>,
  ) {}

  async create(createGenreDto: CreateGenreDto) {
    // const genre = await this.genreRepository.findOne({
    //   where: { name: createGenreDto.name },
    // });
    // const genre = await this.prismaService.genre.findUnique({
    //   where: { name: createGenreDto.name },
    // });
    const genre = await this.genreModel.findOne({ name: createGenreDto.name });

    if (genre) {
      throw new NotFoundException(`이미 존재하는 장르입니다`);
    }

    // return this.genreRepository.save(createGenreDto);
    // return this.prismaService.genre.create({ data: createGenreDto });
    return this.genreModel.create(createGenreDto);
  }

  findAll() {
    // return this.genreRepository.find();
    // return this.prismaService.genre.findMany();
    return this.genreModel.find().exec();
  }

  async findOne(id: number) {
    // const genre = await this.genreRepository.findOne({ where: { id } });
    // const genre = await this.prismaService.genre.findUnique({ where: { id } });
    const genre = await this.genreModel.findById(id).exec();

    if (!genre) {
      throw new NotFoundException(`Genre with ID ${id} not found`);
    }

    return genre;
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    // const genre = await this.genreRepository.findOne({ where: { id } });
    // const genre = await this.prismaService.genre.findUnique({ where: { id } });
    const genre = await this.genreModel.findById(id).exec();

    if (!genre) {
      throw new NotFoundException(`Genre with ID ${id} not found`);
    }

    // await this.genreRepository.update({ id }, { ...updateGenreDto });
    // await this.prismaService.genre.update({
    //   where: { id },
    //   data: updateGenreDto,
    // });
    await this.genreModel.findByIdAndUpdate(id, updateGenreDto).exec();

    // const newGenre = await this.genreRepository.findOne({ where: { id } });
    // const newGenre = await this.prismaService.genre.findUnique({
    //   where: { id },
    // });
    const newGenre = await this.genreModel.findById(id).exec();

    return newGenre;
  }

  async remove(id: number) {
    // const genre = await this.genreRepository.findOne({ where: { id } });
    // const genre = await this.prismaService.genre.findUnique({ where: { id } });
    const genre = await this.genreModel.findById(id).exec();

    if (!genre) {
      throw new NotFoundException(`Genre with ID ${id} not found`);
    }

    // await this.genreRepository.delete(id);
    // await this.prismaService.genre.delete({ where: { id } });
    await this.genreModel.findByIdAndDelete(id).exec();

    return id;
  }
}
