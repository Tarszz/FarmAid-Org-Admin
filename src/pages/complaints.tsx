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
  limit,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { Send, Search } from "lucide-react";

interface User {
  id: string;
  firstname: string;
  lastname: string;
  userType: string;
}

interface ChatMessage {
  id: string;
  chatRoomId: string;
  message: string;
  senderId: string;
  senderName: string;
  timestamp: any;
  readByAdmin?: boolean;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all users and initial latest messages
  useEffect(() => {
    const fetchUsers = async () => {
      const chatRoomsSnap = await getDocs(collection(db, "donationOrgChats"));
      
      const usersData: User[] = chatRoomsSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          firstname: data.donorName || "Unknown",
          lastname: "",
          userType: "Donor",
        };
      });
      setUsers(usersData);

      // Setup latest messages and unread chats
      const latest: Record<string, ChatMessage> = {};
      const unreadIds: string[] = [];
      chatRoomsSnap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        latest[docSnap.id] = {
          id: docSnap.id,
          chatRoomId: docSnap.id,
          message: data.lastMessage || "",
          senderId: data.lastMessageFrom || "donor",
          senderName: data.donorName || "Donor",
          timestamp: data.lastMessageTime || null,
          readByAdmin: data.readByAdmin || false,
        };

        if (data.lastMessageFrom !== "admin" && !data.readByAdmin) {
          unreadIds.push(docSnap.id);
        }
      });
      setLatestChats(latest);
      setUnreadChats(unreadIds);
    };

    fetchUsers();
  }, []);

  // Listen for latest messages updates per user
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    users.forEach((user) => {
      const chatDocRef = doc(db, "donationOrgChats", user.id);

      const unsubscribe = onSnapshot(chatDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
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
        }
      });

      unsubscribers.push(unsubscribe);
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [users]);

  // Realtime messages for selected user
  useEffect(() => {
    if (!selectedUser) return;

    const messagesRef = collection(db, "donationOrgChats", selectedUser.id, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
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
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const markAsRead = async (chatRoomId: string) => {
    const chatDocRef = doc(db, "donationOrgChats", chatRoomId);
    await updateDoc(chatDocRef, { readByAdmin: true });
    setUnreadChats((prev) => prev.filter((id) => id !== chatRoomId));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    const chatDocRef = doc(db, "donationOrgChats", selectedUser.id);
    const messagesRef = collection(chatDocRef, "messages");

    // Update chat document
    await setDoc(
      chatDocRef,
      {
        donorName: selectedUser.firstname,
        lastMessage: newMessage.trim(),
        lastMessageTime: serverTimestamp(),
        lastMessageFrom: "admin",
        readByAdmin: true,
      },
      { merge: true }
    );

    // Add message in messages subcollection
    await addDoc(messagesRef, {
      message: newMessage.trim(),
      senderId: "admin",
      senderName: "Admin",
      timestamp: serverTimestamp(),
    });

    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  const sortedUsers = [...users].sort((a, b) => {
    const aTime = latestChats[a.id]?.timestamp?.toDate?.() || 0;
    const bTime = latestChats[b.id]?.timestamp?.toDate?.() || 0;
    return bTime - aTime;
  });

  const filteredUsers = sortedUsers.filter((u) => {
    const name = `${u.firstname} ${u.lastname}`.toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesUnread = filter === "unread" ? unreadChats.includes(u.id) : true;
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
              className={`text-sm px-3 py-1 rounded-full ${
                filter === "unread"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setFilter("unread")}
            >
              Unread{" "}
              {unreadChats.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadChats.length}
                </span>
              )}
            </button>
            <button
              className={`text-sm px-3 py-1 rounded-full ${
                filter === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setFilter("all")}
            >
              All Chats
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredUsers.length === 0 && (
            <p className="text-gray-500 text-center mt-4">No users found</p>
          )}
          {filteredUsers.map((user) => {
            const lastMsg = latestChats[user.id];
            const preview =
              lastMsg?.message?.length > 30
                ? lastMsg.message.substring(0, 30) + "..."
                : lastMsg?.message || "No messages yet";
            const isUnread = unreadChats.includes(user.id);

            return (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 relative ${
                  selectedUser?.id === user.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">
                      {user.firstname} {user.lastname}
                    </p>
                    <p className="text-sm text-gray-500">{user.userType}</p>
                  </div>
                  <p className="text-xs text-gray-400 text-right">
                    {lastMsg?.timestamp?.toDate
                      ? new Date(lastMsg.timestamp.toDate()).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
                <p className="text-sm text-gray-600 truncate mt-1">{preview}</p>
                {isUnread && (
                  <span className="absolute top-4 right-4 bg-red-500 w-3 h-3 rounded-full"></span>
                )}
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
              <h2 className="font-semibold text-lg">
                {selectedUser.firstname} {selectedUser.lastname}
              </h2>
              <p className="text-sm text-gray-500">{selectedUser.userType}</p>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-3 flex ${
                    msg.senderId === "admin" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-xs break-words ${
                      msg.senderId === "admin"
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-200 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    <p>{msg.message}</p>
                    <p className="text-[10px] mt-1 text-right opacity-80">
                      {msg.timestamp?.toDate
                        ? new Date(msg.timestamp.toDate()).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Sending..."}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Fixed Input */}
            <div className="p-4 bg-white border-t flex items-center flex-shrink-0">
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring focus:ring-blue-300"
              />
              <button
                onClick={sendMessage}
                className="ml-3 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
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
