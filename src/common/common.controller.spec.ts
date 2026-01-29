import { Test, TestingModule } from '@nestjs/testing';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { ConfigModule } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';

describe('CommonController', () => {
  let controller: CommonController;

  const mockQueue = {
    add: jest.fn(),
    process: jest.fn(),
    on: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      controllers: [CommonController],
      providers: [
        CommonService,
        {
          provide: getQueueToken('thumbnail-generation'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    controller = module.get<CommonController>(CommonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
