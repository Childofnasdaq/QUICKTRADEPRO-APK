import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "./firebase"

// Function to list all collections in Firestore
export async function listCollections() {
  try {
    const collections = await db.listCollections()
    return collections.map((col) => col.id)
  } catch (error) {
    console.error("Error listing collections:", error)
    return []
  }
}

// Function to list all documents in a collection
export async function listDocuments(collectionName: string) {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName))
    const documents: any[] = []

    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return documents
  } catch (error) {
    console.error(`Error listing documents in ${collectionName}:`, error)
    return []
  }
}

// Function to get a specific document
export async function getDocument(collectionName: string, documentId: string) {
  try {
    const docRef = doc(db, collectionName, documentId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      }
    } else {
      console.log("No such document!")
      return null
    }
  } catch (error) {
    console.error(`Error getting document ${documentId} from ${collectionName}:`, error)
    return null
  }
}

