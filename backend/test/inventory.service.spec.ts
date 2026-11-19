import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { InventoryService } from '../src/inventory/inventory.service';
import { InventoryMovement } from '../src/inventory/entities/inventory-movement.entity';
import { Product } from '../src/products/entities/product.entity';

describe('InventoryService - Deducción Atómica e Idempotencia', () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(InventoryMovement),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('debe rechazar doble descuento para la misma venta (Idempotencia)', async () => {
    const mockManager: any = {
      findOne: jest.fn().mockResolvedValue({ id: 'existing-mov-id' }), // Ya existe movimiento
    };

    await expect(
      service.deductStockForSale(
        [{ productId: 'prod-1', quantity: 2 }],
        'sale-123',
        'BK-2026-0001',
        'user-1',
        mockManager,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('debe lanzar error si el stock disponible es insuficiente', async () => {
    const mockManager: any = {
      findOne: jest.fn()
        .mockResolvedValueOnce(null) // no existing movement for sale
        .mockResolvedValueOnce({ id: 'prod-1', name: 'Bratwurst', stock: 1 }), // product with stock 1
      save: jest.fn(),
      create: jest.fn(),
    };

    await expect(
      service.deductStockForSale(
        [{ productId: 'prod-1', quantity: 5 }], // requested 5
        'sale-124',
        'BK-2026-0002',
        'user-1',
        mockManager,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
