/* =========================
   API Abstraction Layer
   Firebase Firestore Implementation
   ========================= */

const API = {
  /* ----- Members ----- */

  // Get all members
  async getMembers() {
    try {
      const snapshot = await db.collection(COLLECTIONS.members).get();
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

  // Get single member by ID
  async getMember(id) {
    try {
      const doc = await db.collection(COLLECTIONS.members).doc(id).get();
      if (!doc.exists) return null;
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
      };
    } catch (e) {
      console.error("[API] getMember error:", e);
      throw e;
    }
  },

  // Create or update member (upsert)
  async saveMember(data) {
    const { id, pass, ...memberData } = data;

    try {
      const docRef = db.collection(COLLECTIONS.members).doc(id);
      const doc = await docRef.get();

      if (doc.exists) {
        // Existing member - verify password
        const existing = doc.data();
        if (existing.pass !== pass) {
          return { success: false, message: "パスワードが違います" };
        }
        // Update
        await docRef.update({
          ...memberData,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, message: "更新しました" };
      } else {
        // New member - create
        await docRef.set({
          ...memberData,
          pass,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, message: "登録しました" };
      }
    } catch (e) {
      console.error("[API] saveMember error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  // Verify member password (for login)
  async verifyMember(id, pass) {
    try {
      const doc = await db.collection(COLLECTIONS.members).doc(id).get();
      if (!doc.exists) {
        // New user
        return { exists: false, valid: true };
      }
      const data = doc.data();
      return {
        exists: true,
        valid: data.pass === pass,
        member: data.pass === pass ? { id: doc.id, ...data } : null
      };
    } catch (e) {
      console.error("[API] verifyMember error:", e);
      throw e;
    }
  },

  /* ----- Notices ----- */

  // Get public notices (for users)
  async getNotices() {
    try {
      const snapshot = await db.collection(COLLECTIONS.notices)
        .where("isActive", "==", true)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();
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

  // Get all notices (for admin)
  async getNoticesAdmin() {
    try {
      const snapshot = await db.collection(COLLECTIONS.notices)
        .orderBy("createdAt", "desc")
        .get();
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

  // Create notice
  async createNotice(data) {
    try {
      const docRef = await db.collection(COLLECTIONS.notices).add({
        title: data.title || "",
        body: data.body || "",
        isActive: !!data.isActive,
        isImportant: !!data.isImportant,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (e) {
      console.error("[API] createNotice error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  // Update notice
  async updateNotice(id, fields) {
    try {
      const docRef = db.collection(COLLECTIONS.notices).doc(id);
      const updateData = {};
      if (fields.isActive !== undefined) updateData.isActive = fields.isActive;
      if (fields.isImportant !== undefined) updateData.isImportant = fields.isImportant;
      if (fields.title !== undefined) updateData.title = fields.title;
      if (fields.body !== undefined) updateData.body = fields.body;

      await docRef.update(updateData);
      return { success: true };
    } catch (e) {
      console.error("[API] updateNotice error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  // Delete notice
  async deleteNotice(id) {
    try {
      await db.collection(COLLECTIONS.notices).doc(id).delete();
      return { success: true };
    } catch (e) {
      console.error("[API] deleteNotice error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  }
};

// Expose globally
window.API = API;
