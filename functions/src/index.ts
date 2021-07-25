import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { User } from './types/User';
import { Review } from '../../../react-native-tutorial-shop/src/types/Review';
import { Shop } from '../../../react-native-tutorial-shop/src/types/Shop';

admin.initializeApp();

exports.onUpdateUser = functions
  .region('asia-northeast1')
  .firestore.document('users/{userId}')
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
    } catch (err) {
      console.log(err);
    }
  });

exports.onWriteReview = functions
  .region('asia-northeast1')
  .firestore.document('shops/{shopId}/reviews/{reviewId')
  .onWrite(async (change, context) => {
    const { shopId } = context.params;
    const review = change.after.data() as Review;
    const db = admin.firestore();

    try {
      const shopRef = db.collection('shops').doc(shopId);
      const shopDoc = await shopRef.get();
      const shop = shopDoc.data() as Shop;

      let { score1 = 0, score2 = 0, score3 = 0, score4 = 0, score5 = 0 } = shop;
      switch (review.score) {
        case 1:
          score1 += 1;
        case 2:
          score2 += 2;
        case 3:
          score3 += 3;
        case 4:
          score4 += 4;
        case 5:
          score5 += 5;
      }
      let aveScore =
        (score1 * 1 + score2 * 2 + score3 * 3 + score4 * 4 + score5 * 5) /
        (score1 + score2 + score3 + score4 + score5);
      aveScore = Math.round(aveScore * 100) / 100;

      let params = {};
      switch (review.score) {
        case 1:
          params = {
            score1: admin.firestore.FieldValue.increment(1),
            score: aveScore,
          };
        case 2:
          params = {
            score2: admin.firestore.FieldValue.increment(1),
            score: aveScore,
          };
        case 3:
          params = {
            score3: admin.firestore.FieldValue.increment(1),
            score: aveScore,
          };
        case 4:
          params = {
            score4: admin.firestore.FieldValue.increment(1),
            score: aveScore,
          };
        case 5:
          params = {
            score5: admin.firestore.FieldValue.increment(1),
            score: aveScore,
          };
      }
      await shopRef.update(params);
    } catch (error) {
      console.log(error);
    }
  });
