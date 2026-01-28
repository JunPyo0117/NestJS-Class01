import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Director } from './entity/director.entity';
import { Repository } from 'typeorm';
import { PrismaService } from 'src/common/prisma.service';
// import { Model } from 'mongoose';
// import { InjectModel } from '@nestjs/mongoose';
// import { Director } from './schema/director.schema';

@Injectable()
export class DirectorService {
  constructor(
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    // private readonly prismaService: PrismaService,
    // @InjectModel(Director.name)
    // private readonly directorModel: Model<Director>,
  ) {}

  create(createDirectorDto: CreateDirectorDto) {
    return this.directorRepository.save(createDirectorDto);
    // return this.prismaService.director.create({ data: createDirectorDto });
    // return this.directorModel.create(createDirectorDto);
  }

  findAll() {
    return this.directorRepository.find();
    // return this.prismaService.director.findMany();
    // return this.directorModel.find().exec();
  }

  findOne(id: number) {
    return this.directorRepository.findOne({ where: { id } });
    // return this.prismaService.director.findUnique({ where: { id } });
    // return this.directorModel.findById(id).exec();
  }

  async update(id: number, updateDirectorDto: UpdateDirectorDto) {
    const director = await this.directorRepository.findOne({
      where: { id },
    });
    // const director = await this.prismaService.director.findUnique({
    //   where: { id },
    // });
    // const director = await this.directorModel.findById(id).exec();

    if (!director) {
      throw new NotFoundException(`Director with ID ${id} not found`);
    }

    await this.directorRepository.update({ id }, { ...updateDirectorDto });
    // await this.prismaService.director.update({
    //   where: { id },
    //   data: updateDirectorDto,
    // });
    // await this.directorModel.findByIdAndUpdate(id, updateDirectorDto).exec();

    const newDirector = await this.directorRepository.findOne({
      where: { id },
    });
    // const newDirector = await this.prismaService.director.findUnique({
    //   where: { id },
    // });
    // const newDirector = await this.directorModel.findById(id).exec();

    return newDirector;
  }

  async remove(id: number) {
    const director = await this.directorRepository.findOne({
      where: { id },
    });
    // const director = await this.prismaService.director.findUnique({
    //   where: { id },
    // });
    // const director = await this.directorModel.findById(id).exec();

    if (!director) {
      throw new NotFoundException(`Director with ID ${id} not found`);
    }

    await this.directorRepository.delete(id);
    // await this.prismaService.director.delete({ where: { id } });
    // await this.directorModel.findByIdAndDelete(id).exec();

    return id;
  }
}
