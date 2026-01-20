import { UserService } from 'src/user/user.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, Role } from 'src/user/entity/user.entity';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockUserRepository = {
  findOne: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
  decode: jest.fn(),
};

const mockCacheManager = {
  set: jest.fn(),
};

const mockUserService = {
  create: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let configService: ConfigService;
  let jwtService: JwtService;
  let cacheManager: Cache;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('tokenBlock', () => {
    it('should block a token', async () => {
      const token = 'token';
      const payload = { 
        exp: (Math.floor(Date.now() / 1000)) + 60
      };
      jest.spyOn(jwtService, 'decode').mockReturnValue(payload);

      await authService.tokenBlock(token);

      expect(jwtService.decode).toHaveBeenCalledWith(token);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `BLOCK_TOKEN_${token}`,
        payload,
        expect.any(Number),
      );
    });
  });

  describe('parseBasicToken', () => {
    it('should parse a basic token', () => {
      // 'test@test.com:123123'을 base64로 인코딩한 값
      const encodedToken = Buffer.from('test@test.com:123123', 'utf-8').toString('base64');
      const rawToken = `Basic ${encodedToken}`;
      const result = authService.parseBasicToken(rawToken);
      const expected = { email: 'test@test.com', password: '123123' };
      expect(result).toEqual(expected);
    });

    it('should throw an error if the token is invalid', () => {
      const rawToken = 'Basic invalidToken';
      expect(() => authService.parseBasicToken(rawToken)).toThrow(BadRequestException);
    });

      it('should throw an error if the Basic token is invalid', () => {
        const rawToken = 'Bearer invalidToken';
        expect(() => authService.parseBasicToken(rawToken)).toThrow(BadRequestException);
      });

    it('should throw an error if the token is invalid', () => {
      const rawToken = 'Basic a';
      expect(() => authService.parseBasicToken(rawToken)).toThrow(BadRequestException);
    });
  });

  describe('parseBearerToken', () => {
    it('should parse a bearer token', async () => {
      const rawToken = 'Bearer token';
      const payload = { type: 'access' };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(configService, 'get').mockReturnValue('secret');

      const result = await authService.parseBearerToken(rawToken, false);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token', { secret: 'secret' });
      expect(result).toEqual(payload);
    });

    it('should throw an error for invalid Bearer token format', async () => {
      const rawToken = 'a';
      await expect(() => authService.parseBearerToken(rawToken, false)).rejects.toThrow(BadRequestException);
    });

    it('should throw an error for invalid Bearer token type', async () => {
      const rawToken = 'Basic a';
      await expect(() => authService.parseBearerToken(rawToken, false)).rejects.toThrow(BadRequestException);
    });

    it('should throw an error for if payload.type is not refresh but is RefreshToken parameter is true', async () => {
      const rawToken = 'Bearer a';

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ type: 'refresh' });

      await expect(() => authService.parseBearerToken(rawToken, false)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an error for if payload.type is not refresh but is RefreshToken parameter is true', async () => {
      const rawToken = 'Bearer a';

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ type: 'access' });
      
      await expect(() => authService.parseBearerToken(rawToken, true)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register a user', async () => {
      const rawToken = 'Basic a';
      const user = { email: 'test@test.com', password: '123123' };

      jest.spyOn(authService, 'parseBasicToken').mockReturnValue(user);
      jest.spyOn(userService, 'create').mockResolvedValue(user);
      const result = await authService.register(rawToken);
      expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
      expect(userService.create).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });
  });

  describe('authenticate', () => {
    it('should authenticate a user with correct credentials', async () => {
      const user = { email: 'test@test.com', password: 'hashedPassword' };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => true);

      const result = await authService.authenticate(user.email, user.password);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: user.email } });
      expect(bcrypt.compare).toHaveBeenCalledWith(user.password, 'hashedPassword');
      expect(result).toEqual(user);
    });

    it('should throw an error if the user is not exists', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);
      await expect(() => authService.authenticate('test@test.com', '123123')).rejects.toThrow(BadRequestException);
    });

    it('should throw an error if the password is incorrect', async () => {
      const user = { email: 'test@test.com', password: 'hashedPassword' };
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => false);
      await expect(() => authService.authenticate('test@test.com', '123123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('issueToken', () => {
    const user = { id: 1, role: Role.user };
    const token = 'accessToken';

    beforeEach(() => {
      jest.spyOn(mockConfigService, 'get').mockReturnValue('secret');
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(token);
    });

    it('should issue an acess tokens', async () => {
      const result = await authService.issueToken(user, false);

      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: user.id, role: Role.user, type: 'access' }, { secret: 'secret', expiresIn: '300s' });
      expect(result).toEqual(token);
    });

    it('should issue an acess tokens', async () => {
      const result = await authService.issueToken(user, true);

      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: user.id, role: Role.user, type: 'refresh' }, { secret: 'secret', expiresIn: '24h' });
      expect(result).toEqual(token);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const rawToken = 'Basic a';
      const email = 'test@test.com';
      const password = '123123';
      const user = {id: 1, role: Role.user};

      jest.spyOn(authService, 'parseBasicToken').mockReturnValue({ email, password });
      jest.spyOn(authService, 'authenticate').mockResolvedValue(user as User);
      jest.spyOn(authService, 'issueToken').mockResolvedValue('mock.token');

      const result = await authService.login(rawToken);

      expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
      expect(authService.authenticate).toHaveBeenCalledWith(email, password);
      expect(authService.issueToken).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ accessToken: 'mock.token', refreshToken: 'mock.token' });
    });
  });
});
