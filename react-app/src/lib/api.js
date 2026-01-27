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
  notices: 'notices',
  bands: 'bands',
  events: 'events',
  entries: 'entries',
  timetables: 'timetables',
  setlists: 'setlists',
  studioSchedules: 'studioSchedules',
  bandRequests: 'bandRequests',
  lotteries: 'lotteries',
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
          roles: [],
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
  },

  /* ----- Roles (v1.0.0) ----- */

  async updateMemberRoles(memberId, roles) {
    try {
      const docRef = doc(db, COLLECTIONS.members, memberId);
      await updateDoc(docRef, {
        roles,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (e) {
      console.error("[API] updateMemberRoles error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  async getAllMembers() {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.members));
      return snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || d.id,
          part: data.part || "",
          grade: data.grade || "",
          roles: data.roles || [],
        };
      });
    } catch (e) {
      console.error("[API] getAllMembers error:", e);
      throw e;
    }
  },

  /* ----- Bands (v1.0.0) ----- */

  async createBand(data) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.bands), {
        name: data.name,
        members: data.members, // [{id, name, part}]
        equipment: data.equipment || "",
        comment: data.comment || "",
        status: "recruiting", // recruiting | closed
        createdBy: data.createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (e) {
      console.error("[API] createBand error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  async getBands() {
    try {
      const q = query(
        collection(db, COLLECTIONS.bands),
        orderBy("updatedAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        };
      });
    } catch (e) {
      console.error("[API] getBands error:", e);
      throw e;
    }
  },

  async getBand(id) {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.bands, id));
      if (!docSnap.exists()) return null;
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    } catch (e) {
      console.error("[API] getBand error:", e);
      throw e;
    }
  },

  async updateBand(id, fields) {
    try {
      const docRef = doc(db, COLLECTIONS.bands, id);
      await updateDoc(docRef, {
        ...fields,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (e) {
      console.error("[API] updateBand error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  /* ----- Band Requests (v1.0.0) ----- */

  async createBandRequest(bandId, applicantId, applicantName, applicantPart) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.bandRequests), {
        bandId,
        applicantId,
        applicantName,
        applicantPart,
        status: "pending", // pending | approved | rejected
        createdAt: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (e) {
      console.error("[API] createBandRequest error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  async getBandRequests(bandId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.bandRequests),
        where("bandId", "==", bandId),
        where("status", "==", "pending")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
      }));
    } catch (e) {
      console.error("[API] getBandRequests error:", e);
      throw e;
    }
  },

  async updateBandRequest(requestId, status) {
    try {
      const docRef = doc(db, COLLECTIONS.bandRequests, requestId);
      await updateDoc(docRef, { status });
      return { success: true };
    } catch (e) {
      console.error("[API] updateBandRequest error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  /* ----- Events (v1.0.0) ----- */

  async createEvent(data) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.events), {
        name: data.name,
        type: data.type, // "live" | "other"
        date: data.date,
        location: data.location || "",
        entryStart: data.entryStart || null,
        entryEnd: data.entryEnd || null,
        prepStart: data.prepStart || null,
        prepEnd: data.prepEnd || null,
        setDiagramStart: data.setDiagramStart || null,
        setDiagramEnd: data.setDiagramEnd || null,
        setDiagramFileUrl: data.setDiagramFileUrl || "",
        youtubeUrl: data.youtubeUrl || "",
        createdBy: data.createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (e) {
      console.error("[API] createEvent error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  async getEvents() {
    try {
      const q = query(
        collection(db, COLLECTIONS.events),
        orderBy("date", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: d.data().updatedAt?.toDate?.()?.toISOString() || null,
      }));
    } catch (e) {
      console.error("[API] getEvents error:", e);
      throw e;
    }
  },

  async getEvent(id) {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.events, id));
      if (!docSnap.exists()) return null;
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    } catch (e) {
      console.error("[API] getEvent error:", e);
      throw e;
    }
  },

  async updateEvent(id, fields) {
    try {
      const docRef = doc(db, COLLECTIONS.events, id);
      await updateDoc(docRef, {
        ...fields,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (e) {
      console.error("[API] updateEvent error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  async deleteEvent(id) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.events, id));
      return { success: true };
    } catch (e) {
      console.error("[API] deleteEvent error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  /* ----- Entries (v1.0.0) ----- */

  async createEntry(data) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.entries), {
        eventId: data.eventId,
        type: data.type, // "band" | "individual"
        bandId: data.bandId || null,
        bandName: data.bandName || "",
        memberId: data.memberId || null,
        memberName: data.memberName || "",
        songs: data.songs || [], // [{order, title, artist}]
        status: "entered", // entered | selected | rejected
        createdAt: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (e) {
      console.error("[API] createEntry error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  async getEntriesByEvent(eventId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.entries),
        where("eventId", "==", eventId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
      }));
    } catch (e) {
      console.error("[API] getEntriesByEvent error:", e);
      throw e;
    }
  },

  async updateEntry(id, fields) {
    try {
      const docRef = doc(db, COLLECTIONS.entries, id);
      await updateDoc(docRef, fields);
      return { success: true };
    } catch (e) {
      console.error("[API] updateEntry error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  /* ----- Studio Schedules (v1.0.0) ----- */

  async createStudioSchedule(data) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.studioSchedules), {
        bandId: data.bandId,
        bandName: data.bandName,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        locationOther: data.locationOther || "",
        members: data.members || [],
        createdBy: data.createdBy,
        createdAt: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (e) {
      console.error("[API] createStudioSchedule error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  async getStudioSchedules() {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.studioSchedules));
      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
      }));
    } catch (e) {
      console.error("[API] getStudioSchedules error:", e);
      throw e;
    }
  },

  async deleteStudioSchedule(id) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.studioSchedules, id));
      return { success: true };
    } catch (e) {
      console.error("[API] deleteStudioSchedule error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  /* ----- Timetables (v1.0.0) ----- */

  async saveTimetable(eventId, slots) {
    try {
      const docRef = doc(db, COLLECTIONS.timetables, eventId);
      await setDoc(docRef, {
        eventId,
        slots, // [{startTime, endTime, bandName}]
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (e) {
      console.error("[API] saveTimetable error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  async getTimetable(eventId) {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.timetables, eventId));
      if (!docSnap.exists()) return null;
      return docSnap.data();
    } catch (e) {
      console.error("[API] getTimetable error:", e);
      throw e;
    }
  },

  /* ----- Setlists (v1.0.0) ----- */

  async saveSetlist(eventId, bandId, songs) {
    try {
      const docId = `${eventId}_${bandId}`;
      const docRef = doc(db, COLLECTIONS.setlists, docId);
      await setDoc(docRef, {
        eventId,
        bandId,
        songs, // [{order, title, artist}]
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (e) {
      console.error("[API] saveSetlist error:", e);
      return { success: false, message: "エラーが発生しました" };
    }
  },

  async getSetlistsByEvent(eventId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.setlists),
        where("eventId", "==", eventId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));
    } catch (e) {
      console.error("[API] getSetlistsByEvent error:", e);
      throw e;
    }
  },
};
