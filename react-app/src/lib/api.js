import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';

const COLLECTIONS = {
  members: 'members',
  notices: 'notices'
};

export const API = {
  /* ----- Members ----- */

  async getMembers() {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.members));
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
        };
      });
    } catch (e) {
      console.error("[API] getMembers error:", e);
      throw e;
    }
  },

  async getMember(id) {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.members, id));
      if (!docSnap.exists()) return null;
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
      };
    } catch (e) {
      console.error("[API] getMember error:", e);
      throw e;
    }
  },

  async saveMember(data) {
    const { id, pass, ...memberData } = data;

    try {
      const docRef = doc(db, COLLECTIONS.members, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const existing = docSnap.data();
        if (existing.pass !== pass) {
          return { success: false, message: "パスワードが違います" };
        }
        await updateDoc(docRef, {
          ...memberData,
          updatedAt: serverTimestamp()
        });
        return { success: true, message: "更新しました" };
      } else {
        await setDoc(docRef, {
          ...memberData,
          pass,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return { success: true, message: "登録しました" };
      }
    } catch (e) {
      console.error("[API] saveMember error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  async verifyMember(id, pass) {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.members, id));
      if (!docSnap.exists()) {
        return { exists: false, valid: true };
      }
      const data = docSnap.data();
      return {
        exists: true,
        valid: data.pass === pass,
        member: data.pass === pass ? { id: docSnap.id, ...data } : null
      };
    } catch (e) {
      console.error("[API] verifyMember error:", e);
      throw e;
    }
  },

  /* ----- Notices ----- */

  async getNotices() {
    try {
      const q = query(
        collection(db, COLLECTIONS.notices),
        where("isActive", "==", true),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
      }));
    } catch (e) {
      console.error("[API] getNotices error:", e);
      throw e;
    }
  },

  async getNoticesAdmin() {
    try {
      const q = query(
        collection(db, COLLECTIONS.notices),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
      }));
    } catch (e) {
      console.error("[API] getNoticesAdmin error:", e);
      throw e;
    }
  },

  async createNotice(data) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.notices), {
        title: data.title || "",
        body: data.body || "",
        isActive: !!data.isActive,
        isImportant: !!data.isImportant,
        createdAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (e) {
      console.error("[API] createNotice error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  async updateNotice(id, fields) {
    try {
      const docRef = doc(db, COLLECTIONS.notices, id);
      const updateData = {};
      if (fields.isActive !== undefined) updateData.isActive = fields.isActive;
      if (fields.isImportant !== undefined) updateData.isImportant = fields.isImportant;
      if (fields.title !== undefined) updateData.title = fields.title;
      if (fields.body !== undefined) updateData.body = fields.body;

      await updateDoc(docRef, updateData);
      return { success: true };
    } catch (e) {
      console.error("[API] updateNotice error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  async deleteNotice(id) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.notices, id));
      return { success: true };
    } catch (e) {
      console.error("[API] deleteNotice error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  }
};
