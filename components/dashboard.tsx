"use client"

import { useState, useEffect } from "react"
import { signOut } from "firebase/auth"
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { UserList } from "@/components/user-list"
import { UserForm } from "@/components/user-form"
import { generateLicenseKey } from "@/lib/utils"

export function Dashboard({ user }: { user: any }) {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const usersSnapshot = await getDocs(collection(db, "users"))
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setUsers(usersData)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (userData: any) => {
    try {
      const newUser = {
        ...userData,
        licenseKey: generateLicenseKey(),
        isActive: true,
        createdAt: new Date().toISOString(),
      }

      // Use email as the document ID for easier lookup
      await setDoc(doc(db, "users", newUser.email), newUser)

      // Send welcome email with license details (mock implementation)
      sendWelcomeEmail(newUser)

      setShowAddUser(false)
      fetchUsers()
    } catch (error) {
      console.error("Error adding user:", error)
    }
  }

  const handleUpdateUser = async (userData: any) => {
    try {
      await setDoc(
        doc(db, "users", userData.email),
        {
          ...userData,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      )

      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteDoc(doc(db, "users", userId))
        fetchUsers()
      } catch (error) {
        console.error("Error deleting user:", error)
      }
    }
  }

  const sendWelcomeEmail = (userData: any) => {
    // This is a mock implementation
    // In a real app, you would use a server function or API to send emails
    console.log("Sending welcome email to:", userData.email, {
      mentorId: userData.mentorId,
      licenseKey: userData.licenseKey,
      expiryDate: userData.licenseExpiry,
    })

    // Show a notification to the admin
    alert(`Welcome email sent to ${userData.email} with their Mentor ID and License Key`)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-red-600">QuickTradePro Admin Portal</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">{user.email}</span>
            <button
              onClick={handleLogout}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Manage Users</h2>
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Add New User
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <UserList users={users} onEdit={setSelectedUser} onDelete={handleDeleteUser} />
        )}

        {showAddUser && <UserForm onSubmit={handleAddUser} onCancel={() => setShowAddUser(false)} />}

        {selectedUser && (
          <UserForm user={selectedUser} onSubmit={handleUpdateUser} onCancel={() => setSelectedUser(null)} />
        )}
      </main>
    </div>
  )
}

