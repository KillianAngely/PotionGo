import { adminAuth } from '../config/firebase-admin';

async function setAdminClaim(email: string) {
  try {
    const user = await adminAuth.getUserByEmail(email);
    
    await adminAuth.setCustomUserClaims(user.uid, {
      admin: true,
      role: 'admin'
    });

    console.log(`Successfully set admin claims for user: ${email}`);
    const updatedUser = await adminAuth.getUser(user.uid);
    console.log('User details:', {
      uid: updatedUser.uid,
      email: updatedUser.email,
      customClaims: updatedUser.customClaims,
      metadata: updatedUser.metadata
    });
    
  } catch (error) {
    console.error('Error setting admin claim:', error);
  }
}

async function removeAdminClaim(email: string) {
  try {
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.setCustomUserClaims(user.uid, null);
    console.log(`Successfully removed admin claims for user: ${email}`);
    const updatedUser = await adminAuth.getUser(user.uid);
    console.log('Updated user claims:', updatedUser.customClaims);
    
  } catch (error) {
    console.error('Error removing admin claim:', error);
  }
}

async function checkUserClaims(email: string) {
  try {
    const user = await adminAuth.getUserByEmail(email);
    console.log('\nUser Claims Check:');
    console.log('------------------');
    console.log('Email:', email);
    console.log('UID:', user.uid);
    console.log('Custom Claims:', user.customClaims);
    console.log('------------------\n');
  } catch (error) {
    console.error('Error checking user claims:', error);
  }
}

setAdminClaim('test+1@gmail.com')
  .then(() => checkUserClaims('test+1@gmail.com'));


// removeAdminClaim('admin@example.com')
//   .then(() => checkUserClaims('admin@example.com'));

export { setAdminClaim, removeAdminClaim, checkUserClaims };