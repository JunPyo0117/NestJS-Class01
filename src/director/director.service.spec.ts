import { CreateDirectorDto } from './dto/create-director.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { DirectorService } from './director.service';
import { Repository } from 'typeorm';
import { Director } from './entity/director.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { NotFoundException } from '@nestjs/common';

const mockDirectorRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('DirectorService', () => {
  let directorService: DirectorService;
  let directorRepository: Repository<Director>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectorService,
        {
          provide: getRepositoryToken(Director),
          useValue: mockDirectorRepository,
        },
      ],
    }).compile();

    directorService = module.get<DirectorService>(DirectorService);
    directorRepository = module.get<Repository<Director>>(
      getRepositoryToken(Director),
    );
  });

  beforeAll(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(directorService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new director and return it', async () => {
      const createDirectorDto: CreateDirectorDto = {
        name: 'John Doe',
        dob: new Date('1970-07-30'),
        nationality: 'American',
      };

      jest
        .spyOn(mockDirectorRepository, 'save')
        .mockResolvedValue(CreateDirectorDto);

      const result = await directorService.create(createDirectorDto);

      expect(mockDirectorRepository.save).toHaveBeenCalledWith(
        createDirectorDto,
      );
      expect(result).toEqual(CreateDirectorDto);
    });
  });

  describe('findAll', () => {
    it('should return all directors', async () => {
      const directors = [
        {
          id: 1,
          name: 'John Doe',
          dob: new Date('1970-07-30'),
          nationality: 'American',
        },
      ];

      jest.spyOn(mockDirectorRepository, 'find').mockResolvedValue(directors);

      const result = await directorService.findAll();

      expect(mockDirectorRepository.find).toHaveBeenCalled();
      expect(result).toEqual(directors);
    });
  });

  describe('findOne', () => {
    it('should return a director by id', async () => {
      const director = {
        id: 1,
        name: 'John Doe',
        dob: new Date('1970-07-30'),
        nationality: 'American',
      };
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(director);

      const result = await directorService.findOne(director.id);

      expect(mockDirectorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(director);
    });
  });

  describe('update', () => {
    it('should update a director and return it', async () => {
      const updateDirectorDto: UpdateDirectorDto = {
        name: 'John Doe',
      };

      const existingDirector = { id: 1, name: 'John Doe' };
      const updatedDirector = { id: 1, name: 'Jane Doe 2' };

      jest
        .spyOn(mockDirectorRepository, 'findOne')
        .mockResolvedValueOnce(existingDirector);
      jest
        .spyOn(mockDirectorRepository, 'findOne')
        .mockResolvedValueOnce(updatedDirector);

      const result = await directorService.update(1, updateDirectorDto);

      expect(directorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(directorRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        updateDirectorDto,
      );
      expect(result).toEqual(updatedDirector);
    });

    it('should throw a NotFoundException if director to update is not found', async () => {
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(null);

      expect(directorService.update(1, { name: 'John Doe' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a director and return it', async () => {
      const director = {
        id: 1,
        name: 'John Doe',
        dob: new Date('1970-07-30'),
        nationality: 'American',
      };
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(director);

      const result = await directorService.remove(director.id);

      expect(mockDirectorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockDirectorRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(1);
    });

    it('should throw a NotFoundException if director to delete is not found', async () => {
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(null);

      expect(directorService.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
