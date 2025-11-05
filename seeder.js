const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 1. Cargar los modelos y los datos
const Question = require('./models/Question'); //
const questionsData = require('./questions.json'); //

// 2. Cargar variables de entorno
dotenv.config(); //

// 3. Conectar a la Base de Datos
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI); //
    console.log('MongoDB Conectado para el Seeder...');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// 4. Función para IMPORTAR los datos
const importData = async () => {
  try {
    //     // Primero, borramos todo lo que haya para no duplicar
    await Question.deleteMany();
    console.log('Datos antiguos eliminados.');

    // Segundo, insertamos todos los datos del JSON
    await Question.insertMany(questionsData);
    console.log('¡Datos importados exitosamente! ✅');
    process.exit(); // Salimos del script

  } catch (error) {
    console.error('Error al importar datos:', error);
    process.exit(1);
  }
};

// 5. Función para DESTRUIR los datos
const destroyData = async () => {
  try {
    await Question.deleteMany();
    console.log('Datos destruidos exitosamente. 🗑️');
    process.exit();
  } catch (error) {
    console.error('Error al destruir datos:', error);
    process.exit(1);
  }
};

// 6. Lógica para decidir qué función ejecutar
const runScript = async () => {
  await connectDB();

  // process.argv[2] es el "argumento" que escribes en la terminal
  if (process.argv[2] === '-d') {
    // Si escribes: node seeder.js -d
    await destroyData();
  } else if (process.argv[2] === '-i') {
    // Si escribes: node seeder.js -i
    await importData();
  } else {
    console.log('Comando no reconocido. Usa:');
    console.log('  -i  para importar datos');
    console.log('  -d  para borrar datos');
    process.exit();
  }
};

runScript();