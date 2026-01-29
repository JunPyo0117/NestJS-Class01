import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { AuthService } from 'src/auth/auth.service';
import { DataSource } from 'typeorm';

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  const mockChatService = {
    registerClient: jest.fn(),
    removeClient: jest.fn(),
    createMessage: jest.fn(),
    joinUserRooms: jest.fn(),
  };

  const mockAuthService = {
    verifyToken: jest.fn(),
    extractTokenFromHeader: jest.fn(),
    parseBearerToken: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {},
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: ChatService,
          useValue: mockChatService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
