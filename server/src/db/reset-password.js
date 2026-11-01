import { hashPassword } from './src/utils/hash.js';
import { dbAsync } from './src/config/database.js';

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('Usage : node reset-password.js <email> <nouveau_mot_de_passe>');
  process.exit(1);
}

const hash = await hashPassword(newPassword);

// Essayer learners d'abord
let result = await dbAsync.run(
  'UPDATE learners SET password_hash = ? WHERE email = ?',
  [hash, email]
);

// Puis admins
if (result.changes === 0) {
  result = await dbAsync.run(
    'UPDATE admins SET password_hash = ? WHERE email = ?',
    [hash, email]
  );
}

if (result.changes === 0) {
  console.log('❌ Aucun compte avec cet email :', email);
} else {
  console.log('✅ Mot de passe réinitialisé pour', email);
  console.log('   Nouveau mot de passe :', newPassword);
}
