import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from 'src/common/const/env.const';
// import { PrismaService } from 'src/common/prisma.service';
// import { Prisma } from '@prisma/client';
// import { User } from './schema/user.schema';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    // private readonly prismaService: PrismaService,
    // @InjectModel(User.name)
    // private readonly userModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;

    // const user = await this.userModel.findOne({ email });
    // const user = await this.prismaService.user.findUnique({ where: { email } });
    const user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      throw new BadRequestException('User already exists');
    }

    const hash = await bcrypt.hash(
      password,
      this.configService.get<number>(envVariableKeys.hashRounds)!,
    );

    // await this.userModel.create({ email, password: hash });
    // await this.prismaService.user.create({ data: { email, password: hash } });
    await this.userRepository.save({ email, password: hash });

    // return this.userModel.findOne({ email }).exec();
    // return this.prismaService.user.findUnique({ where: { email } });
    return this.userRepository.findOne({ where: { email } });
  }

  findAll() {
    // return this.userModel.find().exec();
    // return this.prismaService.user.findMany({
    //   omit: {
    //     password: true,
    //   },
    // });
    return this.userRepository.find();
  }

  async findOne(id: number) {
    // const user = await this.userModel.findById(id).exec();
    // const user = await this.prismaService.user.findUnique({
    //   where: { id },
    //   omit: {
    //     password: true,
    //   },
    // });
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    // const user = await this.userModel.findById(id).exec();
    // const user = await this.prismaService.user.findUnique({ where: { id } });
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { password, ...rest } = updateUserDto;

    const updateData: Partial<User> = { ...rest };
    // const updateData: Prisma.UserUpdateInput = { ...rest };

    if (password) {
      const hash = await bcrypt.hash(
        password,
        this.configService.get<number>(envVariableKeys.hashRounds)!,
      );
      updateData.password = hash;
    }

    // await this.userModel.findByIdAndUpdate(id, updateData).exec();
    // await this.prismaService.user.update({ where: { id }, data: updateData });
    await this.userRepository.update({ id }, updateData);

    // return this.userModel.findById(id).exec();
    // return this.prismaService.user.findUnique({
    //   where: { id },
    //   omit: {
    //     password: true,
    //   },
    // });

    return this.userRepository.findOne({ where: { id } });
  }

  async remove(id: number) {
    // const user = await this.userModel.findById(id).exec();
    // const user = await this.prismaService.user.findUnique({ where: { id } });
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // await this.userModel.findByIdAndDelete(id).exec();
    // await this.prismaService.user.delete({ where: { id } });
    await this.userRepository.delete(id);

    return id;
  }
}
