const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './backend/.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'drone_light_show',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '1234',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

async function testConnection() {
  try {
    console.log('🔌 Подключение к базе данных...');
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных успешно установлено!');
    
    // Проверка таблиц
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`\n📊 Найдено таблиц: ${results.length}`);
    console.log('\n📋 Список таблиц:');
    results.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    
    await sequelize.close();
    console.log('\n✅ Тест подключения завершен успешно!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error.message);
    console.error('\n💡 Убедитесь, что:');
    console.error('   1. PostgreSQL запущен');
    console.error('   2. База данных создана (запустите scripts/init-db.sh)');
    console.error('   3. Параметры подключения в backend/.env корректны');
    process.exit(1);
  }
}

testConnection();

