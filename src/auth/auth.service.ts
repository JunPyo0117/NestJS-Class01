import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User, Role } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { envVariableKeys } from 'src/common/const/env.const';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { UserService } from 'src/user/user.service';
// import { PrismaService } from 'src/common/prisma.service';
// import { PrismaClient } from '@prisma/client';
// import { User } from 'src/user/schema/user.schema';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly userService: UserService,
    // private readonly prismaService: PrismaService,
    // @InjectModel(User.name)
    // private readonly userModel: Model<User>,
  ) {}

  async tokenBlock(token: string) {
    const payload = await this.jwtService.decode(token);

    // payload['exp'] 토큰 만료 시간
    const expiryDate = +new Date(payload['exp'] * 1000);
    const now = +new Date();

    const diffrenceInSeconds = (expiryDate - now) / 1000;

    await this.cacheManager.set(
      `BLOCK_TOKEN_${token}`,
      payload,
      Math.max(diffrenceInSeconds * 1000, 1),
    );

    return true;
  }

  parseBasicToken(rawToken: string) {
    // 1 토큰을 ' ' 기준으로 나누기
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('Invalid token');
    }

    const [basic, token] = basicSplit;

    if (basic.toLocaleLowerCase() !== 'basic') {
      throw new BadRequestException('Invalid token');
    }

    // 2 추출한 토큰을 base64 디코딩해서 이메일과 비밀번호로 나눈다
    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    // 3 이메일과 비밀번호로 나눈다 email:password 형식으로 되어있음
    const tokenSplit = decoded.split(':');

    if (tokenSplit.length !== 2) {
      throw new BadRequestException('Invalid token');
    }

    const [email, password] = tokenSplit;

    return { email, password };
  }

  async parseBearerToken(rawToken: string, isRefreshToken: boolean) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('Invalid token');
    }

    const [bearer, token] = basicSplit;

    if (bearer.toLocaleLowerCase() !== 'bearer') {
      throw new BadRequestException('Invalid token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          isRefreshToken
            ? envVariableKeys.refreshTokenSecret
            : envVariableKeys.accessTokenSecret,
        ),
      });
      if (isRefreshToken) {
        if (payload.type !== 'refresh') {
          throw new BadRequestException('Refresh 토큰을 입력해주세요');
        }
      } else {
        if (payload.type !== 'access') {
          throw new BadRequestException('Access 토큰을 입력해주세요');
        }
      }

      return payload;
    } catch (e) {
      throw new UnauthorizedException('토큰이 만료되었습니다');
    }
  }

  // rawToken: Basic $token
  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    return this.userService.create({ email, password });
  }

  async authenticate(email: string, password: string) {
    // const user = await this.prismaService.user.findUnique({ where: { email } });
    const user = await this.userRepository.findOne({ where: { email } });
    // const user = await this.userModel
    //   .findOne({ email }, { password: 1, role: 1 })
    //   .exec();

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const passOk = await bcrypt.compare(password, user.password);

    if (!passOk) {
      throw new BadRequestException('Invalid password');
    }

    return user;
  }

  async issueToken(user: { id: number; role: Role }, isRefreshToken: boolean) {
    const refreshTokenSecret = this.configService.get<string>(
      envVariableKeys.refreshTokenSecret,
    )!;
    const accessTokenSecret = this.configService.get<string>(
      envVariableKeys.accessTokenSecret,
    )!;

    return await this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        type: isRefreshToken ? 'refresh' : 'access',
      },
      {
        secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
        expiresIn: isRefreshToken ? '24h' : '300s',
      },
    );
  }

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.authenticate(email, password);

    return {
      refreshToken: await this.issueToken(user, true),
      accessToken: await this.issueToken(user, false),
    };
  }
}
