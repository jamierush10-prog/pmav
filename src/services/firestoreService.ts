import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  FirestoreDataConverter
} from 'firebase/firestore';
import { db } from '../firebase';
import { MRC, Project, ProjectOverride, SPMIG } from '../types';

const spmigConverter: FirestoreDataConverter<SPMIG> = {
  toFirestore: ({ id, ...rest }) => rest,
  fromFirestore: (snap) => ({ id: snap.id, ...(snap.data() as Omit<SPMIG, 'id'>) })
};

const mrcConverter: FirestoreDataConverter<MRC> = {
  toFirestore: ({ id, ...rest }) => rest,
  fromFirestore: (snap) => ({ id: snap.id, ...(snap.data() as Omit<MRC, 'id'>) })
};

const projectConverter: FirestoreDataConverter<Project> = {
  toFirestore: ({ id, ...rest }) => rest,
  fromFirestore: (snap) => ({ id: snap.id, ...(snap.data() as Omit<Project, 'id'>) })
};

const overrideConverter: FirestoreDataConverter<ProjectOverride> = {
  toFirestore: ({ id, ...rest }) => rest,
  fromFirestore: (snap) => ({ id: snap.id, ...(snap.data() as Omit<ProjectOverride, 'id'>) })
};

const spmigCollection = collection(db, 'spmigs').withConverter(spmigConverter);
const mrcCollection = collection(db, 'mrcs').withConverter(mrcConverter);
const projectCollection = collection(db, 'projects').withConverter(projectConverter);
const overrideCollection = collection(db, 'projectOverrides').withConverter(overrideConverter);

export async function fetchSPMIGs(): Promise<SPMIG[]> {
  const snapshot = await getDocs(spmigCollection);
  return snapshot.docs.map((docSnap) => docSnap.data());
}

export async function createSPMIG(data: Omit<SPMIG, 'id'>): Promise<string> {
  const docRef = await addDoc(spmigCollection, data);
  return docRef.id;
}

export async function updateSPMIG(id: string, data: Partial<SPMIG>): Promise<void> {
  await updateDoc(doc(spmigCollection, id), data);
}

export async function deleteSPMIG(id: string): Promise<void> {
  await deleteDoc(doc(spmigCollection, id));
}

export async function fetchMRCs(): Promise<MRC[]> {
  const snapshot = await getDocs(mrcCollection);
  return snapshot.docs.map((docSnap) => docSnap.data());
}

export async function getMRC(id: string): Promise<MRC | undefined> {
  const docSnap = await getDoc(doc(mrcCollection, id));
  return docSnap.exists() ? docSnap.data() : undefined;
}

export async function createMRC(data: Omit<MRC, 'id'>): Promise<string> {
  const docRef = await addDoc(mrcCollection, data);
  return docRef.id;
}

export async function updateMRC(id: string, data: Partial<MRC>): Promise<void> {
  await updateDoc(doc(mrcCollection, id), data);
}

export async function deleteMRC(id: string): Promise<void> {
  await deleteDoc(doc(mrcCollection, id));
}

export async function fetchProjects(): Promise<Project[]> {
  const snapshot = await getDocs(projectCollection);
  return snapshot.docs.map((docSnap) => docSnap.data());
}

export async function getProject(id: string): Promise<Project | undefined> {
  const docSnap = await getDoc(doc(projectCollection, id));
  return docSnap.exists() ? docSnap.data() : undefined;
}

export async function createProject(data: Omit<Project, 'id'>): Promise<string> {
  const docRef = await addDoc(projectCollection, data);
  return docRef.id;
}

export async function updateProject(id: string, data: Partial<Project>): Promise<void> {
  await updateDoc(doc(projectCollection, id), data);
}

export async function deleteProject(id: string): Promise<void> {
  await deleteDoc(doc(projectCollection, id));
}

export async function fetchOverrides(projectId?: string): Promise<ProjectOverride[]> {
  const snapshot = await getDocs(overrideCollection);
  const overrides = snapshot.docs.map((docSnap) => docSnap.data());
  if (!projectId) return overrides;
  return overrides.filter((ovr) => ovr.projectId === projectId);
}

export async function createOverride(data: Omit<ProjectOverride, 'id'>): Promise<string> {
  const docRef = await addDoc(overrideCollection, data);
  return docRef.id;
}

export async function updateOverride(id: string, data: Partial<ProjectOverride>): Promise<void> {
  await updateDoc(doc(overrideCollection, id), data);
}

export async function deleteOverride(id: string): Promise<void> {
  await deleteDoc(doc(overrideCollection, id));
}
