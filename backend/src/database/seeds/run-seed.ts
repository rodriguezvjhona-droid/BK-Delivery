import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Product } from '../../products/entities/product.entity';
import { RoleEnum } from '../../common/enums';

export async function runSeeds(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  const categoryRepository = dataSource.getRepository(Category);
  const productRepository = dataSource.getRepository(Product);

  console.log('--- Iniciando Semillas de Base de Datos para BK Delivery ---');

  // 1. Usuarios Iniciales
  const salt = await bcrypt.genSalt(10);

  const defaultUsers = [
    {
      fullName: 'Administrador General BK',
      email: 'admin@bkdelivery.com',
      password: await bcrypt.hash('Admin123!', salt),
      role: RoleEnum.ADMIN,
      phone: '+57 312 456 7890',
      isActive: true,
    },
    {
      fullName: 'Hans Becker (Cajero POS)',
      email: 'cajero@bkdelivery.com',
      password: await bcrypt.hash('Cajero123!', salt),
      role: RoleEnum.EMPLOYEE,
      phone: '+57 310 987 6543',
      isActive: true,
    },
    {
      fullName: 'Fritz Wagner (Repartidor Express)',
      email: 'repartidor@bkdelivery.com',
      password: await bcrypt.hash('Repartidor123!', salt),
      role: RoleEnum.DELIVERY,
      phone: '+57 318 555 4433',
      isActive: true,
    },
  ];

  for (const u of defaultUsers) {
    const existing = await userRepository.findOne({ where: { email: u.email } });
    if (!existing) {
      await userRepository.save(userRepository.create(u));
      console.log(`Usuario creado: ${u.email} (${u.role})`);
    }
  }

  // 2. Categorías Obligatorias: Bebidas, Comidas, Entradas, Picadas, Adicionales
  const initialCategories = [
    {
      name: 'Comidas',
      description: 'Platos fuertes alemanes, salchichas artesanales, hamburguesas gourmet y schnitzel',
    },
    {
      name: 'Bebidas',
      description: 'Cervezas artesanales e importadas alemanas, gaseosas y sodas saborizadas',
    },
    {
      name: 'Entradas',
      description: 'Pretzels horneados, croquetas y tablas degustación ligeras',
    },
    {
      name: 'Picadas',
      description: 'Tablas mixtas para compartir con surtido de salchichas, papas y quesos',
    },
    {
      name: 'Adicionales',
      description: 'Porciones extra de chucrut, papas rústicas, salsas dijon y pan artesanal',
    },
  ];

  const categoryMap = new Map<string, Category>();

  for (const cat of initialCategories) {
    let category = await categoryRepository.findOne({ where: { name: cat.name } });
    if (!category) {
      category = await categoryRepository.save(categoryRepository.create(cat));
      console.log(`Categoría creada: ${cat.name}`);
    }
    categoryMap.set(cat.name, category);
  }

  // 3. Catálogo Real de Productos de Comida y Bebida Alemana
  const comidasCat = categoryMap.get('Comidas');
  const bebidasCat = categoryMap.get('Bebidas');
  const entradasCat = categoryMap.get('Entradas');
  const picadasCat = categoryMap.get('Picadas');
  const adicionalesCat = categoryMap.get('Adicionales');

  const defaultProducts = [
    // Comidas
    {
      code: 'BK-COM-01',
      name: 'Bratwurst Tradicional en Pan Brioche',
      description: 'Salchicha blanca de cerdo condimentada con mejorana, acompañada de chucrut agridulce y mostaza dijon en pan brioche tostado.',
      imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&auto=format&fit=crop&q=60',
      costPrice: 9500,
      sellingPrice: 22000,
      stock: 40,
      minStock: 8,
      categoryId: comidasCat?.id,
    },
    {
      code: 'BK-COM-02',
      name: 'Currywurst de Berlín con Papas Rústicas',
      description: 'Clásica salchicha alemana troceada bañada en salsa secreta de tomate al curry suave, servida con generosa porción de papas.',
      imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=60',
      costPrice: 10500,
      sellingPrice: 24500,
      stock: 35,
      minStock: 8,
      categoryId: comidasCat?.id,
    },
    {
      code: 'BK-COM-03',
      name: 'Wiener Schnitzel de Cerdo',
      description: 'Milanesa fina apanada dorada y crujiente, servida con rodajas de limón fresco, ensalada de papa tibia y salsa tártara.',
      imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&auto=format&fit=crop&q=60',
      costPrice: 14000,
      sellingPrice: 32000,
      stock: 25,
      minStock: 5,
      categoryId: comidasCat?.id,
    },
    {
      code: 'BK-COM-04',
      name: 'Hamburguesa Schwarzwald (Selva Negra)',
      description: 'Carne Angus 200g, queso tilsit fundido, tocineta crocante caramelizada en cerveza negra y cebolla crispy.',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
      costPrice: 13500,
      sellingPrice: 29900,
      stock: 30,
      minStock: 6,
      categoryId: comidasCat?.id,
    },

    // Bebidas
    {
      code: 'BK-BEB-01',
      name: 'Cerveza Paulaner Hefe-Weißbier 500ml',
      description: 'Cerveza de trigo tradicional de Múnich, turbia natural, refrescante con sutiles notas de plátano y clavo.',
      imageUrl: 'https://images.unsplash.com/photo-1608270191763-71a74d287bb7?w=500&auto=format&fit=crop&q=60',
      costPrice: 9000,
      sellingPrice: 18000,
      stock: 60,
      minStock: 12,
      categoryId: bebidasCat?.id,
    },
    {
      code: 'BK-BEB-02',
      name: 'Cerveza Erdinger Dunkel 500ml',
      description: 'Cerveza de trigo oscura con maltas tostadas que otorgan un sabor profundo a caramelo y pan horneado.',
      imageUrl: 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=500&auto=format&fit=crop&q=60',
      costPrice: 9500,
      sellingPrice: 19000,
      stock: 45,
      minStock: 10,
      categoryId: bebidasCat?.id,
    },
    {
      code: 'BK-BEB-03',
      name: 'Apfelschorle Artesanal 400ml',
      description: 'Bebida alemana refrescante a base de jugo de manzana natural prensado en frío con agua mineral con gas.',
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60',
      costPrice: 3200,
      sellingPrice: 8500,
      stock: 50,
      minStock: 10,
      categoryId: bebidasCat?.id,
    },

    // Entradas
    {
      code: 'BK-ENT-01',
      name: 'Brezel Alemán Horneado con Mantequilla de Hierbas',
      description: 'Pretzel bávaro gigante con cristales de sal marina, recién horneado y servido con salsa de queso gouda caliente.',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60',
      costPrice: 4000,
      sellingPrice: 12000,
      stock: 30,
      minStock: 6,
      categoryId: entradasCat?.id,
    },

    // Picadas
    {
      code: 'BK-PIC-01',
      name: 'Gran Picada Oktoberfest (Para 3-4 personas)',
      description: 'Surtido de Bratwurst, Knackwurst, bondiola ahumada, papas rústicas, aros de cebolla, brezel y dips de mostazas.',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=60',
      costPrice: 28000,
      sellingPrice: 65000,
      stock: 20,
      minStock: 4,
      categoryId: picadasCat?.id,
    },

    // Adicionales
    {
      code: 'BK-ADI-01',
      name: 'Porción Extra de Chucrut Sauerkraut',
      description: 'Repollo fermentado tradicional aromatizado con bayas de enebro.',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=60',
      costPrice: 2000,
      sellingPrice: 5000,
      stock: 50,
      minStock: 10,
      categoryId: adicionalesCat?.id,
    },
    {
      code: 'BK-ADI-02',
      name: 'Porción de Papas Rústicas con Romero',
      description: 'Papas en cascos crocantes por fuera y suaves por dentro con toque de romero y sal marina.',
      imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=60',
      costPrice: 2500,
      sellingPrice: 7000,
      stock: 45,
      minStock: 10,
      categoryId: adicionalesCat?.id,
    },
  ];

  for (const prod of defaultProducts) {
    if (!prod.categoryId) continue;
    const existing = await productRepository.findOne({ where: { code: prod.code } });
    if (!existing) {
      await productRepository.save(productRepository.create(prod));
      console.log(`Producto creado: ${prod.code} - ${prod.name}`);
    }
  }

  console.log('--- Semillas de Base de Datos completadas con éxito ---');
}
