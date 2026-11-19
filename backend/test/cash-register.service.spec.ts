import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CashRegisterService } from '../src/cash-register/cash-register.service';
import { CashRegister } from '../src/cash-register/entities/cash-register.entity';
import { CashMovement } from '../src/cash-register/entities/cash-movement.entity';
import { PaymentMethodEnum, CashRegisterStatusEnum } from '../src/common/enums';

describe('CashRegisterService - Reglas Contables y Separación de Transferencias', () => {
  let service: CashRegisterService;
  let mockCashRegisterRepo: any;
  let mockCashMovementRepo: any;

  beforeEach(async () => {
    mockCashRegisterRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    mockCashMovementRepo = {
      save: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashRegisterService,
        {
          provide: getRepositoryToken(CashRegister),
          useValue: mockCashRegisterRepo,
        },
        {
          provide: getRepositoryToken(CashMovement),
          useValue: mockCashMovementRepo,
        },
      ],
    }).compile();

    service = module.get<CashRegisterService>(CashRegisterService);
  });

  it('debe registrar pago en efectivo sumando al efectivo esperado', async () => {
    const mockRegister = {
      id: 'reg-1',
      status: CashRegisterStatusEnum.OPEN,
      cashSales: 0,
      expectedCash: 100000,
      transferSales: 0,
      cardSales: 0,
    };

    const mockManager: any = {
      findOne: jest.fn().mockResolvedValue(mockRegister),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      create: jest.fn().mockReturnValue({}),
    };

    await service.registerSalePayment(
      PaymentMethodEnum.CASH,
      50000,
      'sale-1',
      'BK-001',
      'user-1',
      mockManager,
    );

    expect(mockRegister.cashSales).toBe(50000);
    expect(mockRegister.expectedCash).toBe(150000);
    expect(mockRegister.transferSales).toBe(0);
  });

  it('debe registrar transferencia separadamente SIN sumarla al efectivo físico esperado', async () => {
    const mockRegister = {
      id: 'reg-1',
      status: CashRegisterStatusEnum.OPEN,
      cashSales: 50000,
      expectedCash: 150000,
      transferSales: 0,
      cardSales: 0,
    };

    const mockManager: any = {
      findOne: jest.fn().mockResolvedValue(mockRegister),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      create: jest.fn().mockReturnValue({}),
    };

    await service.registerSalePayment(
      PaymentMethodEnum.TRANSFER,
      30000,
      'sale-2',
      'BK-002',
      'user-1',
      mockManager,
    );

    // Regla de Negocio Obligatoria: Las transferencias nunca suman al efectivo físico
    expect(mockRegister.transferSales).toBe(30000);
    expect(mockRegister.cashSales).toBe(50000);
    expect(mockRegister.expectedCash).toBe(150000); // El efectivo físico esperado no cambia
  });
});
