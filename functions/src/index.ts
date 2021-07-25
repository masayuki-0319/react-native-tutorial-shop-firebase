import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { User } from './types/User';

admin.initializeApp();

export const onUpdateUser = functions
  .region('asia-northeast1')
  .firestore.document('users/{userUd}')
  .onUpdate(async (change, context) => {
    const { userId } = context.params;
    const newUser = change.after.data() as User;
    const db = admin.firestore();

    try {
      const snapshot = await db
        .collectionGroup('reviews')
        .where('user.id', '==', userId)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach((reviewDoc) => {
        const user = { ...reviewDoc.data().user, name: newUser.name };
        batch.update(reviewDoc.ref, { user });
      });
      await batch.commit();
    } catch (error) {
      console.error(error);
    }
  });
