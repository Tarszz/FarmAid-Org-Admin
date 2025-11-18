import React, { useEffect, useState, useRef } from "react";
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  setDoc,
  updateDoc,
  limit,
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { Send, Search, Image as ImageIcon } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

interface User {
  id: string;
  firstname: string;
  lastname: string;
  userType: string;
}

interface ChatMessage {
  id?: string;
  chatRoomId?: string;
  message?: string;
  senderId?: string;
  senderName?: string;
  timestamp?: any;
  readByAdmin?: boolean;
  imageUrl?: string | null;
}

const Complaints: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [latestChats, setLatestChats] = useState<Record<string, ChatMessage | null>>({});
  const [unreadChats, setUnreadChats] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentProgress, setAttachmentProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch all donationOrgChats documents as users list
  useEffect(() => {
    const fetch = async () => {
      const chatRoomsSnap = await getDocs(collection(db, "donationOrgChats"));
      const usersData: User[] = chatRoomsSnap.docs.map(snap => ({
        id: snap.id,
        firstname: (snap.data() as any).donorName || "Unknown",
        lastname: "",
        userType: "Donor",
      }));

      const latest: Record<string, ChatMessage> = {};
      const unreadIds: string[] = [];

      chatRoomsSnap.docs.forEach((snap) => {
        const data = snap.data() as any;
        latest[snap.id] = {
          id: snap.id,
          chatRoomId: snap.id,
          message: data.lastMessage || "",
          senderId: data.lastMessageFrom || "donor",
          senderName: data.donorName || "Donor",
          timestamp: data.lastMessageTime || null,
          readByAdmin: data.readByAdmin || false,
        };

        if (data.lastMessageFrom !== "admin" && !data.readByAdmin) {
          unreadIds.push(snap.id);
        }
      });

      setUsers(usersData);
      setLatestChats(latest);
      setUnreadChats(unreadIds);
    };

    fetch();
  }, []);

  // Listen for updates on chat docs (for lastMessage changes)
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    users.forEach((user) => {
      const chatDocRef = doc(db, "donationOrgChats", user.id);
      const unsub = onSnapshot(chatDocRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data() as any;
        const latestMsg: ChatMessage = {
          id: docSnap.id,
          chatRoomId: docSnap.id,
          message: data.lastMessage || "",
          senderId: data.lastMessageFrom || "donor",
          senderName: data.donorName || "Donor",
          timestamp: data.lastMessageTime || null,
          readByAdmin: data.readByAdmin || false,
        };

        setLatestChats((prev) => ({ ...prev, [user.id]: latestMsg }));
        if (latestMsg.senderId !== "admin" && !latestMsg.readByAdmin) {
          setUnreadChats((prev) => Array.from(new Set([...prev, user.id])));
        }
      });

      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach(u => u());
  }, [users]);

  // Realtime messages for selected user
  useEffect(() => {
    if (!selectedUser) return;

    const messagesRef = collection(db, "donationOrgChats", selectedUser.id, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as ChatMessage),
      }));
      setMessages(msgs);
      scrollToBottom();
      markAsRead(selectedUser.id);
    });

    return () => unsubscribe();
  }, [selectedUser]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const markAsRead = async (chatRoomId: string) => {
    const chatDocRef = doc(db, "donationOrgChats", chatRoomId);
    try {
      await updateDoc(chatDocRef, { readByAdmin: true });
      setUnreadChats(prev => prev.filter(id => id !== chatRoomId));
    } catch (err) {
      console.error('Error marking chat read', err);
    }
  };

  const sendMessage = async (imageUrl?: string | null) => {
    if ((!newMessage.trim() && !imageUrl) || !selectedUser) return;

    try {
      const chatDocRef = doc(db, "donationOrgChats", selectedUser.id);
      const messagesRef = collection(chatDocRef, "messages");

      const msgText = newMessage.trim() || (imageUrl ? 'Sent an image' : '');

      // Update chat doc meta
      await setDoc(chatDocRef, {
        donorName: selectedUser.firstname,
        lastMessage: msgText,
        lastMessageFrom: 'admin',
        lastMessageTime: serverTimestamp(),
        readByAdmin: true,
      }, { merge: true });

      // Add message
      await addDoc(messagesRef, {
        message: msgText,
        senderId: 'admin',
        senderName: 'Admin',
        imageUrl: imageUrl || null,
        timestamp: serverTimestamp(),
      });

      setNewMessage('');
      setAttachmentFile(null);
      setPreview(null);
      setAttachmentProgress(0);
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message', err);
    }
  };

  // local preview state for attachment
  const [preview, setPreview] = useState<string | null>(null);

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(f.type)) {
      alert('Only JPEG and PNG allowed');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      alert('Image too large (max 5MB)');
      return;
    }
    setAttachmentFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSendWithAttachment = async () => {
    if (!attachmentFile && !newMessage.trim()) return;
    if (!selectedUser) return;

    setUploadingAttachment(true);
    setAttachmentProgress(0);

    try {
      let imageUrl: string | null = null;

      if (attachmentFile) {
        const storageRef = ref(storage, `chat_images/${selectedUser.id}_${Date.now()}_${attachmentFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, attachmentFile);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snap) => {
              const percent = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
              setAttachmentProgress(percent);
            },
            (err) => reject(err),
            async () => {
              imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      // send message with imageUrl (or only text)
      await sendMessage(imageUrl);
    } catch (err) {
      console.error('Error uploading attachment or sending message', err);
      alert('Failed to send attachment/message. Check console for details.');
    } finally {
      setUploadingAttachment(false);
      setAttachmentFile(null);
      setPreview(null);
      setAttachmentProgress(0);
    }
  };

  // Sort users by latest message time
  const sortedUsers = [...users].sort((a, b) => {
    const aTime = latestChats[a.id]?.timestamp?.toDate?.() || 0;
    const bTime = latestChats[b.id]?.timestamp?.toDate?.() || 0;
    return bTime - aTime;
  });

  // Filter users by unread or search term
  const filteredUsers = sortedUsers.filter((u) => {
    const name = `${u.firstname} ${u.lastname}`.toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesUnread = filter === 'unread' ? unreadChats.includes(u.id) : true;
    return matchesSearch && matchesUnread;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-lg font-semibold mb-3">Messages</h1>
          <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 mb-3">
            <Search size={16} className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none flex-1 text-sm text-gray-700"
            />
          </div>
          <div className="flex gap-2">
            <button
              className={`text-sm px-3 py-1 rounded-full ${filter === 'unread' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setFilter('unread')}
            >
              Unread {unreadChats.length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadChats.length}</span>}
            </button>
            <button
              className={`text-sm px-3 py-1 rounded-full ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setFilter('all')}
            >
              All Chats
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredUsers.length === 0 && <p className="text-gray-500 text-center mt-4">No users found</p>}

          {filteredUsers.map((user) => {
            const lastMsg = latestChats[user.id];
            const previewText =
              lastMsg?.message?.length > 30 ? lastMsg.message.substring(0, 30) + '...' : lastMsg?.message || 'No messages yet';
            const isUnread = unreadChats.includes(user.id);

            return (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 relative ${selectedUser?.id === user.id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{user.firstname} {user.lastname}</p>
                    <p className="text-sm text-gray-500">{user.userType}</p>
                  </div>
                  <p className="text-xs text-gray-400 text-right">
                    {lastMsg?.timestamp?.toDate ? new Date(lastMsg.timestamp.toDate()).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
                <p className="text-sm text-gray-600 truncate mt-1">{previewText}</p>
                {isUnread && <span className="absolute top-4 right-4 bg-red-500 w-3 h-3 rounded-full"></span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Fixed Header */}
            <div className="p-4 border-b bg-white flex-shrink-0">
              <h2 className="font-semibold text-lg">{selectedUser.firstname} {selectedUser.lastname}</h2>
              <p className="text-sm text-gray-500">{selectedUser.userType}</p>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`mb-3 flex ${msg.senderId === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-xs break-words ${msg.senderId === 'admin' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                    {msg.imageUrl && (
                      <div className="mb-2">
                        <img src={msg.imageUrl} alt="attached" className="max-w-full rounded" />
                      </div>
                    )}
                    {msg.message && <p>{msg.message}</p>}
                    <p className="text-[10px] mt-1 text-right opacity-80">
                      {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Fixed Input */}
            <div className="p-4 bg-white border-t flex items-center flex-shrink-0 gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full border rounded-full px-4 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendWithAttachment(); }}
                />
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={handleAttachmentChange} className="hidden" />
              </div>

              {/* preview thumbnail */}
              {preview && (
                <div className="w-14 h-14 rounded overflow-hidden border">
                  <img src={preview} className="w-full h-full object-cover" alt="preview" />
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-gray-100"
                title="Attach image"
              >
                <ImageIcon />
              </button>

              <button
                onClick={handleSendWithAttachment}
                className={`ml-1 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 ${uploadingAttachment ? 'opacity-70 cursor-wait' : ''}`}
                title="Send"
                disabled={uploadingAttachment}
              >
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default Complaints;
