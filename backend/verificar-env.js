// Script para verificar tu archivo .env
require('dotenv').config();

console.log('📋 Verificando configuración del archivo .env...\n');

console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ NO configurada');
if (process.env.DATABASE_URL) {
  // Ocultar password por seguridad
  const url = process.env.DATABASE_URL;
  const hiddenPassword = url.replace(/:([^:@]+)@/, ':***@');
  console.log('   URL:', hiddenPassword);
}

console.log('\nDIRECT_URL:', process.env.DIRECT_URL ? '✅ Configurada' : '❌ NO configurada');
if (process.env.DIRECT_URL) {
  const url = process.env.DIRECT_URL;
  const hiddenPassword = url.replace(/:([^:@]+)@/, ':***@');
  console.log('   URL:', hiddenPassword);
}

console.log('\nJWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurada' : '❌ NO configurada');
console.log('PORT:', process.env.PORT || '3000 (default)');

console.log('\n✅ Verificación completada');

